# How to connect Flask + YOLOv8 (step by step)

Your React frontend is ready. Follow these steps to get **real** detections.

## Step 1 — Confirm weights

Put your trained file here:

```
backend/best.pt
```

(Already copied if you used the Desktop Lovable project weights.)

## Step 2 — Create Python environment

```powershell
cd C:\Users\Admin\Downloads\RoadDamageDetection\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Step 3 — Start Flask

```powershell
python app.py
```

You should see: `Model loaded: True`

Open: http://localhost:5000/api/health

Expected:

```json
{"status":"ok","model_loaded":true}
```

## Step 4 — Start React (second terminal)

```powershell
cd C:\Users\Admin\Downloads\RoadDamageDetection\frontend
npm run dev
```

Open: http://localhost:5173

## Step 5 — Test image detection

1. Login  
2. Go to **Image Detection**  
3. Upload a road photo  
4. Click **Analyze Image**  
5. You should see bounding boxes + confidence + severity  
6. Header badge should show **Model Online**

## Step 6 — If something fails

| Symptom | Fix |
|--------|-----|
| Backend Offline | Start `python app.py` |
| API Up · Model Missing | Place `best.pt` next to `app.py` |
| CORS / network error | Keep API at `http://localhost:5000` or update `frontend/.env` |
| Slow video | Use a short clip first (10–20 seconds) |

## Severity note (for viva)

Severity is estimated from bounding-box area + class type (green/orange/red).  
It is a **visual estimate**, not an official engineering assessment — say this clearly in your report.
