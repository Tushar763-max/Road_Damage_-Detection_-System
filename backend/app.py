"""
RoadScan AI - Flask backend for YOLOv8 road damage detection.
Run on Windows 10:
    python -m venv venv
    venv\\Scripts\\activate
    pip install -r requirements.txt
    python app.py
Server runs at http://localhost:5000
"""
import base64
import gc
import json
import os
import sqlite3
import subprocess
import uuid
from datetime import datetime

import cv2
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import torch
from ultralytics import YOLO

# Constrain PyTorch to 1 CPU thread to prevent memory spikes on Render free tier (512MB RAM)
torch.set_num_threads(1)

try:
    import imageio_ffmpeg
except ImportError:  # pragma: no cover
    imageio_ffmpeg = None


BASE = os.path.dirname(os.path.abspath(__file__))
UPLOADS = os.path.join(BASE, "uploads")
OUTPUTS = os.path.join(BASE, "outputs")
DB = os.path.join(BASE, "detections.db")
os.makedirs(UPLOADS, exist_ok=True)
os.makedirs(OUTPUTS, exist_ok=True)

# Prefer a working pretrained RDD model. Your custom best.pt scored ~1% conf in tests.
DEFAULT_WEIGHTS = os.path.join(BASE, "YOLOv8_Small_RDD.pt")
FALLBACK_WEIGHTS = os.path.join(BASE, "best.pt")
WEIGHTS = os.environ.get("MODEL_PATH")
if not WEIGHTS:
    WEIGHTS = DEFAULT_WEIGHTS if os.path.exists(DEFAULT_WEIGHTS) else FALLBACK_WEIGHTS

# Friendly labels for RDD Japan/India class codes
CLASS_ALIASES = {
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole",
    "D43": "White Line Blur",
    "D44": "Cross Walk Blur",
    "longitudinal_crack": "Longitudinal Crack",
    "transverse_crack": "Transverse Crack",
    "alligator_crack": "Alligator Crack",
    "pothole": "Pothole",
}

app = Flask(__name__)
CORS(app)
model = YOLO(WEIGHTS) if os.path.exists(WEIGHTS) else None


def pretty_class(name: str) -> str:
    return CLASS_ALIASES.get(name, CLASS_ALIASES.get(name.upper(), name))


HISTORY_EXTRA = {
    "latitude": "REAL",
    "longitude": "REAL",
    "location_name": "TEXT",
    "repair_status": "TEXT",
    "risk_score": "INTEGER",
    "risk_category": "TEXT",
    "status_history": "TEXT",
    "description": "TEXT",
    "owner_email": "TEXT",
    "record_kind": "TEXT",
}


def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute(
        """CREATE TABLE IF NOT EXISTS history(
        id TEXT PRIMARY KEY, type TEXT, filename TEXT, created_at TEXT,
        total INTEGER, severity TEXT, detections TEXT, result_url TEXT)"""
    )
    cols = {row[1] for row in con.execute("PRAGMA table_info(history)")}
    for name, col_type in HISTORY_EXTRA.items():
        if name not in cols:
            con.execute(f"ALTER TABLE history ADD COLUMN {name} {col_type}")
    con.execute(
        """CREATE TABLE IF NOT EXISTS complaints(
        id TEXT PRIMARY KEY, created_at TEXT, owner_email TEXT, filename TEXT,
        photo_url TEXT, description TEXT, location_name TEXT, latitude REAL,
        longitude REAL, severity TEXT, risk_score INTEGER, risk_category TEXT,
        detections TEXT, repair_status TEXT, status_history TEXT)"""
    )
    return con


def read_geo():
    """Use only coordinates the client actually sent. Never invent a location."""

    def num(key):
        raw = (request.form.get(key) or "").strip()
        if not raw:
            return None
        try:
            return float(raw)
        except ValueError:
            return None

    lat, lng = num("latitude"), num("longitude")
    place = (request.form.get("location_name") or "").strip() or None
    if lat is None or lng is None or not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None, None, place
    return lat, lng, place


def compute_risk(dets):
    """0-100 visual estimate from severity, confidence, and how many boxes were found."""
    if not dets:
        return 0, "low"
    weights = {"low": 12, "medium": 24, "high": 38}
    score = 0.0
    for det in dets:
        conf = float(det.get("confidence") or 0)
        score += weights.get(det.get("severity"), 14) * (0.4 + min(conf, 1))
    if len(dets) >= 4:
        score += 8
    score = max(0, min(100, int(round(score))))
    category = "high" if score >= 70 else "medium" if score >= 40 else "low"
    return score, category


def status_log(status, note):
    return json.dumps(
        [{"status": status, "at": datetime.now().isoformat(timespec="seconds"), "note": note}]
    )


def append_status(existing, status, note):
    try:
        items = json.loads(existing) if existing else []
    except json.JSONDecodeError:
        items = []
    items.append(
        {"status": status, "at": datetime.now().isoformat(timespec="seconds"), "note": note}
    )
    return json.dumps(items)


def row_to_dict(row):
    data = dict(row)
    if data.get("detections"):
        try:
            data["detections"] = json.loads(data["detections"])
        except json.JSONDecodeError:
            data["detections"] = []
    else:
        data["detections"] = []
    if data.get("status_history"):
        try:
            data["status_history"] = json.loads(data["status_history"])
        except json.JSONDecodeError:
            data["status_history"] = []
    else:
        data["status_history"] = []
    return data


def severity(box, w, h, cls):
    x1, y1, x2, y2 = box
    pct = (x2 - x1) * (y2 - y1) * 100 / (w * h)
    s = "high" if pct >= 8 else "medium" if pct >= 2 else "low"
    low_name = cls.lower()
    if "crack" in low_name and s == "high":
        s = "medium"
    if "pothole" in low_name or cls.upper() == "D40":
        if pct >= 3:
            s = "high"
        elif pct >= 1:
            s = "medium"
    return s


def worst(dets):
    order = {"low": 0, "medium": 1, "high": 2}
    return max((d["severity"] for d in dets), key=order.get, default=None)


def run(frame, conf):
    # Downscale frames so memory stays strictly under Render free tier (512MB RAM)
    h, w = frame.shape[:2]
    if max(h, w) > 640:
        scale = 640.0 / max(h, w)
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    with torch.inference_mode():
        r = model.predict(frame, conf=conf, imgsz=384, verbose=False, device="cpu")[0]

    cur_h, cur_w = frame.shape[:2]
    dets = []
    for b in r.boxes:
        box = [float(v) for v in b.xyxy[0].tolist()]
        raw = model.names[int(b.cls)]
        cls = pretty_class(str(raw))
        dets.append(
            {
                "class_name": cls,
                "raw_class": str(raw),
                "confidence": float(b.conf),
                "bbox": box,
                "severity": severity(box, cur_w, cur_h, cls),
            }
        )
    plotted = r.plot()
    del r
    gc.collect()
    return dets, plotted


def even_size(w, h, max_w=640):
    """Shrink for faster inference/encoding; keep even dims for H.264."""
    if w > max_w:
        scale = max_w / float(w)
        w = max_w
        h = int(h * scale)
    w -= w % 2
    h -= h % 2
    return max(w, 2), max(h, 2)


def to_data_url(bgr):
    ok, buf = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    if not ok:
        return None
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode()


def write_browser_mp4(frames, out_path, fps):
    """Encode H.264 + yuv420p so Chrome/Edge can play the file."""
    if not frames:
        return False
    h, w = frames[0].shape[:2]
    fps = max(float(fps or 12), 1.0)

    if imageio_ffmpeg is None:
        # Fallback: OpenCV mp4v (may not play in browser; download still works)
        writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
        for fr in frames:
            writer.write(fr)
        writer.release()
        return os.path.exists(out_path) and os.path.getsize(out_path) > 0

    exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        exe,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        f"{w}x{h}",
        "-r",
        str(fps),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-movflags",
        "+faststart",
        out_path,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for fr in frames:
            if fr.shape[0] != h or fr.shape[1] != w:
                fr = cv2.resize(fr, (w, h))
            proc.stdin.write(fr.tobytes())
        proc.stdin.close()
        proc.wait(timeout=120)
    except Exception:
        proc.kill()
        return False
    return proc.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 0


def save(rec):
    risk, category = compute_risk(rec.get("detections") or [])
    with db() as con:
        con.execute(
            """INSERT INTO history
            (id, type, filename, created_at, total, severity, detections, result_url,
             latitude, longitude, location_name, repair_status, risk_score, risk_category,
             status_history, description, owner_email, record_kind)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                rec["id"],
                rec["type"],
                rec["filename"],
                datetime.now().isoformat(),
                rec["total"],
                rec["severity"],
                json.dumps(rec["detections"]),
                rec.get("result_url"),
                rec.get("latitude"),
                rec.get("longitude"),
                rec.get("location_name"),
                rec.get("repair_status") or "reported",
                risk,
                category,
                status_log("reported", "Detection saved"),
                rec.get("description"),
                rec.get("owner_email"),
                rec.get("record_kind") or "detection",
            ),
        )
    return risk, category


@app.get("/api/health")
def health():
    return jsonify(
        status="ok",
        model_loaded=model is not None,
        model_path=os.path.basename(WEIGHTS) if model is not None else None,
        classes=list(model.names.values()) if model is not None else [],
    )


@app.post("/api/detect/image")
def detect_image():
    if model is None:
        return jsonify(error="Model not loaded. Put weights next to app.py."), 503
    f = request.files.get("file")
    if not f:
        return jsonify(error="No file uploaded"), 400
    conf = float(request.form.get("confidence", 0.15))
    lat, lng, place = read_geo()
    rid = str(uuid.uuid4())
    ext = os.path.splitext(f.filename or "")[1] or ".jpg"
    path = os.path.join(UPLOADS, rid + ext)
    f.save(path)
    img = cv2.imread(path)
    if img is None:
        return jsonify(error="Could not read image"), 400
    dets, annotated = run(img, conf)
    ok, buf = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
    data_url = "data:image/jpeg;base64," + base64.b64encode(buf).decode()
    out_name = rid + ".jpg"
    cv2.imwrite(os.path.join(OUTPUTS, out_name), annotated)
    h, w = img.shape[:2]
    del img, annotated, buf
    gc.collect()
    risk, category = save(
        {
            "id": rid,
            "type": "image",
            "filename": f.filename,
            "total": len(dets),
            "severity": worst(dets),
            "detections": dets,
            "result_url": f"/outputs/{out_name}",
            "latitude": lat,
            "longitude": lng,
            "location_name": place,
            "description": request.form.get("description"),
            "owner_email": request.form.get("owner_email"),
        }
    )
    return jsonify(
        {
            "id": rid,
            "filename": f.filename,
            "width": w,
            "height": h,
            "detections": dets,
            "annotated_image": data_url,
            "severity": worst(dets),
            "model": os.path.basename(WEIGHTS),
            "latitude": lat,
            "longitude": lng,
            "location_name": place,
            "repair_status": "reported",
            "risk_score": risk,
            "risk_category": category,
        }
    )


@app.post("/api/detect/video")
def detect_video():
    if model is None:
        return jsonify(error="Model not loaded. Put weights next to app.py."), 503
    f = request.files.get("file")
    if not f:
        return jsonify(error="No file uploaded"), 400
    conf = float(request.form.get("confidence", 0.15))
    lat, lng, place = read_geo()
    rid = str(uuid.uuid4())
    ext = os.path.splitext(f.filename or "")[1] or ".mp4"
    path = os.path.join(UPLOADS, rid + ext)
    f.save(path)
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return jsonify(error="Could not open video file"), 400

    src_fps = cap.get(cv2.CAP_PROP_FPS) or 25
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    src_w, src_h = int(cap.get(3)), int(cap.get(4))
    out_w, out_h = even_size(src_w, src_h, max_w=640)

    # Speed tuning for CPU laptops: skip frames + cap inference count
    if frame_count > 600:
        stride = 5
    elif frame_count > 240:
        stride = 4
    elif frame_count > 120:
        stride = 3
    else:
        stride = 2
    max_infer = 90

    dets, frame_idx, inferred = [], 0, 0
    out_frames = []
    preview = None
    preview_score = -1

    while inferred < max_infer:
        ok, frame = cap.read()
        if not ok:
            break
        if frame_idx % stride == 0:
            small = cv2.resize(frame, (out_w, out_h))
            fd, annotated = run(small, conf)
            for d in fd:
                d["timestamp"] = round(frame_idx / src_fps, 2)
            dets.extend(fd)
            out_frames.append(annotated)
            if len(fd) > preview_score:
                preview_score = len(fd)
                preview = annotated
            inferred += 1
        frame_idx += 1
    cap.release()

    out_name = rid + ".mp4"
    out_path = os.path.join(OUTPUTS, out_name)
    out_fps = max(src_fps / stride, 6)
    encoded = write_browser_mp4(out_frames, out_path, out_fps)
    if not encoded:
        return jsonify(error="Failed to encode processed video"), 500

    if preview is None and out_frames:
        preview = out_frames[len(out_frames) // 2]

    res = {
        "id": rid,
        "filename": f.filename,
        "width": out_w,
        "height": out_h,
        "total_detections": len(dets),
        "frames_processed": inferred,
        "frames_total": frame_count or frame_idx,
        "stride": stride,
        "duration": (frame_count or frame_idx) / src_fps if src_fps else 0,
        "detections": dets,
        "annotated_video": f"/outputs/{out_name}",
        "preview_image": to_data_url(preview) if preview is not None else None,
        "severity": worst(dets),
        "model": os.path.basename(WEIGHTS),
        "note": "Processed with frame skipping for speed. Use a short 5–15s clip for best demos.",
        "latitude": lat,
        "longitude": lng,
        "location_name": place,
        "repair_status": "reported",
    }
    risk, category = save(
        {
            "id": rid,
            "type": "video",
            "filename": f.filename,
            "total": len(dets),
            "severity": res["severity"],
            "detections": dets,
            "result_url": res["annotated_video"],
            "latitude": lat,
            "longitude": lng,
            "location_name": place,
            "owner_email": request.form.get("owner_email"),
        }
    )
    res["risk_score"] = risk
    res["risk_category"] = category
    return jsonify(res)


@app.get("/outputs/<path:name>")
def outputs(name):
    return send_from_directory(OUTPUTS, name, mimetype="video/mp4", conditional=True)


@app.post("/api/detect/frame")
def detect_frame():
    """Live camera frame. Does not invent a result and does not save history."""
    if model is None:
        return jsonify(error="Model not loaded. Put weights next to app.py."), 503
    f = request.files.get("file")
    if not f:
        return jsonify(error="No frame uploaded"), 400
    conf = float(request.form.get("confidence", 0.15))
    data = f.read()
    arr = np_from_bytes(data)
    if arr is None:
        return jsonify(error="Could not read camera frame"), 400
    dets, annotated = run(arr, conf)
    return jsonify(
        {
            "detections": dets,
            "annotated_image": to_data_url(annotated),
            "severity": worst(dets),
            "total": len(dets),
            "risk_score": compute_risk(dets)[0],
            "risk_category": compute_risk(dets)[1],
            "saved": False,
        }
    )


def np_from_bytes(data):
    import numpy as np

    buf = np.frombuffer(data, dtype=np.uint8)
    return cv2.imdecode(buf, cv2.IMREAD_COLOR)


@app.get("/api/history")
def history():
    with db() as con:
        rows = con.execute("SELECT * FROM history ORDER BY created_at DESC").fetchall()
    return jsonify([row_to_dict(r) for r in rows])


@app.get("/api/history/<rid>")
def history_one(rid):
    with db() as con:
        r = con.execute("SELECT * FROM history WHERE id=?", (rid,)).fetchone()
    if not r:
        return jsonify(error="Not found"), 404
    return jsonify(row_to_dict(r))


@app.delete("/api/history/<rid>")
def history_delete(rid):
    with db() as con:
        con.execute("DELETE FROM history WHERE id=?", (rid,))
    return jsonify(ok=True)


def valid_coord(lat, lng):
    return lat is not None and lng is not None


@app.get("/api/tracker")
def tracker():
    points = []
    with db() as con:
        rows = con.execute("SELECT * FROM history ORDER BY created_at DESC").fetchall()
        complaints = con.execute("SELECT * FROM complaints ORDER BY created_at DESC").fetchall()
    for row in rows:
        item = row_to_dict(row)
        if valid_coord(item.get("latitude"), item.get("longitude")):
            item["source_table"] = "detection"
            points.append(item)
    for row in complaints:
        item = row_to_dict(row)
        item["type"] = "complaint"
        item["filename"] = item.get("filename") or "Citizen complaint"
        item["total"] = len(item.get("detections") or [])
        item["source_table"] = "complaint"
        if valid_coord(item.get("latitude"), item.get("longitude")):
            points.append(item)
    return jsonify(points)


@app.get("/api/heatmap")
def heatmap():
    """Group only stored coordinates. Empty list when nothing has a real GPS fix."""
    points = tracker().get_json()
    buckets = {}
    for item in points:
        key = (round(float(item["latitude"]), 2), round(float(item["longitude"]), 2))
        bucket = buckets.setdefault(
            key,
            {
                "latitude": key[0],
                "longitude": key[1],
                "count": 0,
                "high": 0,
                "location_name": item.get("location_name"),
            },
        )
        bucket["count"] += 1
        if item.get("severity") == "high" or item.get("risk_category") == "high":
            bucket["high"] += 1
        if not bucket["location_name"] and item.get("location_name"):
            bucket["location_name"] = item["location_name"]
    zones = []
    for bucket in buckets.values():
        bucket["zone"] = "high" if bucket["high"] >= 2 or bucket["count"] >= 4 else "medium" if bucket["count"] >= 2 else "low"
        zones.append(bucket)
    return jsonify(zones)


@app.patch("/api/repairs/<kind>/<rid>")
def update_repair(kind, rid):
    body = request.get_json(silent=True) or {}
    status = (body.get("status") or "").strip().lower().replace(" ", "_")
    allowed = {"reported", "assigned", "in_progress", "repaired"}
    if status not in allowed:
        return jsonify(error="Status must be reported, assigned, in_progress, or repaired"), 400
    note = (body.get("note") or "Status updated").strip()
    table = "complaints" if kind == "complaint" else "history"
    with db() as con:
        row = con.execute(f"SELECT status_history FROM {table} WHERE id=?", (rid,)).fetchone()
        if not row:
            return jsonify(error="Not found"), 404
        history_json = append_status(row["status_history"], status, note)
        con.execute(
            f"UPDATE {table} SET repair_status=?, status_history=? WHERE id=?",
            (status, history_json, rid),
        )
    return jsonify(ok=True, repair_status=status, status_history=json.loads(history_json))


@app.get("/api/complaints")
def list_complaints():
    email = (request.args.get("email") or "").strip().lower()
    with db() as con:
        rows = con.execute("SELECT * FROM complaints ORDER BY created_at DESC").fetchall()
    items = [row_to_dict(r) for r in rows]
    if email:
        items = [i for i in items if (i.get("owner_email") or "").lower() == email]
    return jsonify(items)


@app.post("/api/complaints")
def create_complaint():
    description = (request.form.get("description") or "").strip()
    place = (request.form.get("location_name") or "").strip()
    if len(description) < 8 or not place:
        return jsonify(error="Add an area name and a description of at least 8 characters."), 400
    lat, lng, _ = read_geo()
    email = (request.form.get("owner_email") or "").strip() or None
    rid = str(uuid.uuid4())
    photo_url = None
    dets = []
    severity = None
    filename = None
    upload = request.files.get("file")
    if upload and upload.filename:
        filename = upload.filename
        ext = os.path.splitext(upload.filename)[1] or ".jpg"
        path = os.path.join(UPLOADS, rid + ext)
        upload.save(path)
        img = cv2.imread(path)
        if img is not None and model is not None:
            conf = float(request.form.get("confidence", 0.15))
            dets, annotated = run(img, conf)
            out_name = rid + ".jpg"
            cv2.imwrite(os.path.join(OUTPUTS, out_name), annotated)
            photo_url = f"/outputs/{out_name}"
            severity = worst(dets)
        elif img is not None:
            out_name = rid + "-original.jpg"
            cv2.imwrite(os.path.join(OUTPUTS, out_name), img)
            photo_url = f"/outputs/{out_name}"
    risk, category = compute_risk(dets)
    created = datetime.now().isoformat(timespec="seconds")
    log = status_log("reported", "Citizen complaint submitted")
    with db() as con:
        con.execute(
            """INSERT INTO complaints
            (id, created_at, owner_email, filename, photo_url, description, location_name,
             latitude, longitude, severity, risk_score, risk_category, detections,
             repair_status, status_history)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                rid,
                created,
                email,
                filename,
                photo_url,
                description,
                place,
                lat,
                lng,
                severity,
                risk,
                category,
                json.dumps(dets),
                "reported",
                log,
            ),
        )
    return jsonify(
        {
            "id": rid,
            "created_at": created,
            "location_name": place,
            "latitude": lat,
            "longitude": lng,
            "description": description,
            "severity": severity,
            "risk_score": risk,
            "risk_category": category,
            "detections": dets,
            "repair_status": "reported",
            "photo_url": photo_url,
            "filename": filename,
        }
    )


@app.get("/api/dashboard/stats")
def stats():
    with db() as con:
        r = con.execute(
            """SELECT COUNT(*) files, COALESCE(SUM(total),0) damages,
            SUM(CASE WHEN severity='high' THEN 1 ELSE 0 END) high FROM history"""
        ).fetchone()
    return jsonify(dict(r))


if __name__ == "__main__":
    print("Model loaded:", model is not None, "from", WEIGHTS)
    if model is not None:
        print("Classes:", model.names)
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1", "t")
    # use_reloader=False avoids double model load / port weirdness on Windows
    app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=False)
