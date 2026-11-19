import type {
  DashboardStats,
  GeoInput,
  HistoryRecord,
  ImageDetectionResponse,
  RepairStatus,
  VideoDetectionResponse,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) {
      throw new ApiError(
        `Backend request timed out (${API_BASE}). On Render free tier, the server takes ~30-50s to wake up from sleep. Please wait a few seconds and try again!`,
        0,
      );
    }
    const isLocal = API_BASE.includes("localhost") || API_BASE.includes("127.0.0.1");
    if (isLocal) {
      throw new ApiError(
        `Cannot connect to local Flask server at ${API_BASE}. Please make sure 'python app.py' is running in your backend terminal.`,
        0,
      );
    }
    throw new ApiError(
      `Cannot connect to backend at ${API_BASE}. Please check if the Render web service is 'Live' and awake.`,
      0,
    );
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export async function checkHealth(): Promise<{
  status: string;
  model_loaded: boolean;
  model_path?: string | null;
  classes?: string[];
}> {
  const controller = new AbortController();
  // 30s timeout to allow Render free tier cold-start to wake up
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await safeFetch(`${API_BASE}/api/health`, { signal: controller.signal });
    return parseJson(res);
  } finally {
    clearTimeout(timer);
  }
}

function appendGeo(form: FormData, geo?: GeoInput) {
  if (!geo) return;
  if (geo.latitude != null && geo.longitude != null) {
    form.append("latitude", String(geo.latitude));
    form.append("longitude", String(geo.longitude));
  }
  if (geo.location_name) form.append("location_name", geo.location_name);
  if (geo.description) form.append("description", geo.description);
  if (geo.owner_email) form.append("owner_email", geo.owner_email);
}

export async function detectImage(
  file: File,
  confidence = 0.25,
  geo?: GeoInput,
): Promise<ImageDetectionResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("confidence", String(confidence));
  appendGeo(form, geo);
  const res = await safeFetch(`${API_BASE}/api/detect/image`, {
    method: "POST",
    body: form,
  });
  return parseJson(res);
}

export async function detectVideo(
  file: File,
  confidence = 0.25,
  geo?: GeoInput,
): Promise<VideoDetectionResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("confidence", String(confidence));
  appendGeo(form, geo);
  const res = await safeFetch(`${API_BASE}/api/detect/video`, {
    method: "POST",
    body: form,
  });
  return parseJson(res);
}

export async function detectFrame(blob: Blob, confidence = 0.15) {
  const form = new FormData();
  form.append("file", blob, "frame.jpg");
  form.append("confidence", String(confidence));
  const res = await safeFetch(`${API_BASE}/api/detect/frame`, { method: "POST", body: form });
  return parseJson<{
    detections: HistoryRecord["detections"];
    annotated_image: string | null;
    severity: HistoryRecord["severity"];
    total: number;
    risk_score: number;
    risk_category: HistoryRecord["risk_category"];
    saved: boolean;
  }>(res);
}

export async function fetchTracker(): Promise<HistoryRecord[]> {
  const res = await fetch(`${API_BASE}/api/tracker`);
  const rows = await parseJson<HistoryRecord[]>(res);
  return rows.map((row) => ({ ...row, source: "model", status: "completed" }));
}

export async function fetchHeatmap(): Promise<
  Array<{
    latitude: number;
    longitude: number;
    count: number;
    high: number;
    zone: "low" | "medium" | "high";
    location_name?: string | null;
  }>
> {
  const res = await fetch(`${API_BASE}/api/heatmap`);
  return parseJson(res);
}

export async function updateRepair(kind: "detection" | "complaint", id: string, status: RepairStatus, note?: string) {
  const res = await fetch(`${API_BASE}/api/repairs/${kind}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }),
  });
  return parseJson(res);
}

export async function fetchComplaints(email?: string): Promise<HistoryRecord[]> {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  const res = await fetch(`${API_BASE}/api/complaints${query}`);
  return parseJson(res);
}

export async function submitComplaint(input: {
  file?: File | null;
  description: string;
  location_name: string;
  latitude?: number | null;
  longitude?: number | null;
  owner_email?: string;
}) {
  const form = new FormData();
  if (input.file) form.append("file", input.file);
  form.append("description", input.description);
  form.append("location_name", input.location_name);
  if (input.latitude != null && input.longitude != null) {
    form.append("latitude", String(input.latitude));
    form.append("longitude", String(input.longitude));
  }
  if (input.owner_email) form.append("owner_email", input.owner_email);
  const res = await fetch(`${API_BASE}/api/complaints`, { method: "POST", body: form });
  return parseJson<HistoryRecord>(res);
}

export async function fetchHistory(): Promise<HistoryRecord[]> {
  const res = await fetch(`${API_BASE}/api/history`);
  const rows = await parseJson<HistoryRecord[]>(res);

  return rows.map((r) => ({
    ...r,
    source: "model" as const,
    status: "completed" as const,
  }));
}

export async function fetchHistoryById(id: string): Promise<HistoryRecord> {
  const res = await fetch(`${API_BASE}/api/history/${id}`);
  const row = await parseJson<HistoryRecord>(res);
  return { ...row, source: "model", status: "completed" };
}

export async function deleteHistory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/history/${id}`, { method: "DELETE" });
  await parseJson(res);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`);
  const raw = await parseJson<{
    files: number;
    damages: number;
    high: number;
  }>(res);

  return {
    totalImages: raw.files,
    totalVideos: 0,
    totalPotholes: raw.damages,
    totalDamagedSegments: raw.damages,
    highSeverity: raw.high ?? 0,
    source: "model",
  };
}

export function absoluteMediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export { API_BASE };
