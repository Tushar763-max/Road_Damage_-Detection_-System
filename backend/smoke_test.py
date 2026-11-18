import cv2
import requests

vid = r"C:\Users\Admin\Documents\pothole-demo\road_video.mp4"
cap = cv2.VideoCapture(vid)
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
idxs = sorted({max(0, total // 4), max(0, total // 2), max(0, 3 * total // 4), max(0, total - 5)})
print("total_frames", total, "try", idxs)

best = None
for i in idxs:
    cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ok, frame = cap.read()
    if not ok:
        continue
    path = rf"C:\Users\Admin\Downloads\RoadDamageDetection\backend\uploads\frame_{i}.jpg"
    cv2.imwrite(path, frame)
    with open(path, "rb") as f:
        r = requests.post(
            "http://localhost:5000/api/detect/image",
            files={"file": f},
            data={"confidence": "0.15"},
            timeout=180,
        )
    data = r.json()
    n = len(data.get("detections", []))
    print(f"frame {i}: status={r.status_code} detections={n} severity={data.get('severity')}")
    if n and best is None:
        best = data

cap.release()

if best:
    print(
        "SAMPLE",
        [
            (d["class_name"], round(d["confidence"], 3), d["severity"])
            for d in best["detections"][:8]
        ],
    )
else:
    print("No detections on sampled frames (pipeline still OK)")
