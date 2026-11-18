from ultralytics import YOLO
import cv2

img_path = r"C:\Users\Admin\Downloads\RoadDamageDetection\backend\uploads\test_frame.jpg"
# also try a user upload if present
from pathlib import Path
uploads = Path(r"C:\Users\Admin\Downloads\RoadDamageDetection\backend\uploads")
candidates = [img_path]
for p in uploads.glob("*"):
    if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".jfif"}:
        candidates.append(str(p))
candidates = list(dict.fromkeys(candidates))[:4]

models = {
    "best.pt": r"C:\Users\Admin\Downloads\RoadDamageDetection\backend\best.pt",
    "RDD": r"C:\Users\Admin\Downloads\RoadDamageDetection\backend\YOLOv8_Small_RDD.pt",
}

for name, path in models.items():
    m = YOLO(path)
    print("\nMODEL", name, "classes", m.names)
    for img in candidates:
        im = cv2.imread(img)
        if im is None:
            continue
        r = m.predict(im, conf=0.15, imgsz=640, verbose=False)[0]
        dets = [(m.names[int(b.cls)], round(float(b.conf), 3)) for b in r.boxes]
        print(" ", Path(img).name, "->", len(dets), dets[:6])
