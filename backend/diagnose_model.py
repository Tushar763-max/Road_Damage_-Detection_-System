"""Quick check: does best.pt fire on the sample video at low confidence?"""
from ultralytics import YOLO
import cv2

MODEL = r"C:\Users\Admin\Downloads\RoadDamageDetection\backend\best.pt"
VID = r"C:\Users\Admin\Documents\pothole-demo\road_video.mp4"
OUT = r"C:\Users\Admin\Documents\pothole-demo\output_demo.mp4"

model = YOLO(MODEL)
print("classes:", model.names)

for label, path, confs in [
    ("road_video", VID, [0.25, 0.10, 0.05, 0.01]),
    ("output_demo", OUT, [0.10, 0.05, 0.01]),
]:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print(label, "MISSING")
        continue
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    # sample a few frames across the clip
    frames = []
    for frac in (0.2, 0.4, 0.6, 0.8):
        idx = int(total * frac)
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if ok:
            frames.append((idx, frame))
    cap.release()
    print(f"\n=== {label} frames={len(frames)} total={total} ===")
    for conf in confs:
        hits = 0
        top = []
        for idx, frame in frames:
            r = model.predict(frame, conf=conf, imgsz=640, verbose=False)[0]
            hits += len(r.boxes)
            for b in r.boxes:
                top.append((float(b.conf), model.names[int(b.cls)], idx))
        top.sort(reverse=True)
        print(f"conf>={conf}: total_boxes={hits} top={top[:5]}")
