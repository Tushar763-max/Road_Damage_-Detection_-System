# Indian Road Damage & Pothole Detection System

Full-stack MCA project: **React + TypeScript frontend** and **Flask + YOLOv8 backend**.

## Project structure

```
RoadDamageDetection/
├── frontend/          # React dashboard (Vite + Tailwind)
├── backend/           # Flask API + best.pt weights
└── README.md
```

## Quick start (Windows 10)

### 1) Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173  
Login with any email + password (min 6 chars), e.g. `student@roadscan.ai` / `demo123`.

### 2) Backend (real YOLOv8 detection)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

API: http://localhost:5000/api/health

Make sure `backend/best.pt` exists (your trained weights).

## Demo vs real results

- Purple **Demo** badges = sample UI data only.
- Green **Model** badges = real Flask/YOLOv8 output.
- If the backend is offline, image/video pages show a clear error — they do **not** invent detections.

## Pages

1. Dashboard  
2. Image Detection  
3. Video Detection  
4. Detection History  
5. Analytics & Reports  
6. About Project  
7. Settings  
8. Login / Register  

## Connect your custom model

1. Copy your trained `best.pt` into `backend/`.
2. Start Flask (`python app.py`).
3. Confirm `model_loaded: true` at `/api/health`.
4. Use Image/Video pages in the React app.

Optional: edit `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:5000
```
