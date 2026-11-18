import type {
  CategoryPoint,
  DashboardStats,
  HistoryRecord,
  SeverityPoint,
  WeeklyPoint,
} from "@/types";

/** Clearly labeled sample data for UI development only. Not model output. */
export const DEMO_BANNER =
  "DEMO DATA — sample figures for UI preview. Real detections appear only when the Flask + YOLOv8 backend is connected.";

export const demoStats: DashboardStats = {
  totalImages: 128,
  totalVideos: 24,
  totalPotholes: 412,
  totalDamagedSegments: 267,
  highSeverity: 89,
  source: "demo",
};

export const demoWeekly: WeeklyPoint[] = [
  { day: "Mon", detections: 42, images: 12, videos: 2 },
  { day: "Tue", detections: 58, images: 18, videos: 3 },
  { day: "Wed", detections: 35, images: 10, videos: 1 },
  { day: "Thu", detections: 71, images: 22, videos: 4 },
  { day: "Fri", detections: 64, images: 19, videos: 3 },
  { day: "Sat", detections: 48, images: 14, videos: 2 },
  { day: "Sun", detections: 29, images: 8, videos: 1 },
];

export const demoCategories: CategoryPoint[] = [
  { name: "Pothole", value: 412, color: "#ef4444" },
  { name: "Longitudinal Crack", value: 156, color: "#f59e0b" },
  { name: "Alligator Crack", value: 98, color: "#3b82f6" },
  { name: "Broken Surface", value: 67, color: "#8b5cf6" },
  { name: "Uneven Road", value: 44, color: "#22c55e" },
];

export const demoSeverity: SeverityPoint[] = [
  { name: "Low", value: 214, color: "#22c55e" },
  { name: "Medium", value: 176, color: "#f59e0b" },
  { name: "High", value: 89, color: "#ef4444" },
];

export const demoHistory: HistoryRecord[] = [
  {
    id: "demo-001",
    type: "image",
    filename: "mumbai_highway_km12.jpg",
    created_at: "2026-11-05T09:24:00",
    total: 5,
    severity: "high",
    detections: [
      { class_name: "Pothole", confidence: 0.91, severity: "high" },
      { class_name: "Pothole", confidence: 0.84, severity: "medium" },
      { class_name: "Alligator Crack", confidence: 0.78, severity: "medium" },
      { class_name: "Broken Surface", confidence: 0.72, severity: "high" },
      { class_name: "Longitudinal Crack", confidence: 0.66, severity: "low" },
    ],
    source: "demo",
    status: "completed",
    preview_label: "Mumbai NH sample",
  },
  {
    id: "demo-002",
    type: "image",
    filename: "pune_ring_road.jpg",
    created_at: "2026-11-04T16:10:00",
    total: 2,
    severity: "medium",
    detections: [
      { class_name: "Pothole", confidence: 0.81, severity: "medium" },
      { class_name: "Longitudinal Crack", confidence: 0.69, severity: "low" },
    ],
    source: "demo",
    status: "completed",
    preview_label: "Pune ring road",
  },
  {
    id: "demo-003",
    type: "video",
    filename: "delhi_arterial_clip.mp4",
    created_at: "2026-11-03T11:42:00",
    total: 18,
    severity: "high",
    detections: [
      { class_name: "Pothole", confidence: 0.88, severity: "high", timestamp: 2.4 },
      { class_name: "Broken Surface", confidence: 0.79, severity: "high", timestamp: 5.1 },
      { class_name: "Uneven Road", confidence: 0.71, severity: "medium", timestamp: 8.0 },
    ],
    source: "demo",
    status: "completed",
    preview_label: "Delhi arterial clip",
  },
  {
    id: "demo-004",
    type: "image",
    filename: "jaipur_colony_lane.png",
    created_at: "2026-11-02T08:05:00",
    total: 1,
    severity: "low",
    detections: [{ class_name: "Longitudinal Crack", confidence: 0.63, severity: "low" }],
    source: "demo",
    status: "completed",
    preview_label: "Jaipur colony lane",
  },
  {
    id: "demo-005",
    type: "video",
    filename: "bangalore_corridor.mov",
    created_at: "2026-11-01T19:20:00",
    total: 11,
    severity: "medium",
    detections: [
      { class_name: "Pothole", confidence: 0.76, severity: "medium", timestamp: 1.2 },
      { class_name: "Alligator Crack", confidence: 0.7, severity: "medium", timestamp: 4.8 },
    ],
    source: "demo",
    status: "completed",
    preview_label: "Bengaluru corridor",
  },
  {
    id: "demo-006",
    type: "image",
    filename: "chennai_coastal_rd.jpeg",
    created_at: "2026-10-30T14:33:00",
    total: 4,
    severity: "high",
    detections: [
      { class_name: "Pothole", confidence: 0.93, severity: "high" },
      { class_name: "Broken Surface", confidence: 0.85, severity: "high" },
      { class_name: "Uneven Road", confidence: 0.74, severity: "medium" },
      { class_name: "Longitudinal Crack", confidence: 0.61, severity: "low" },
    ],
    source: "demo",
    status: "completed",
    preview_label: "Chennai coastal road",
  },
];

export const demoDailyTrend = [
  { label: "01 Nov", potholes: 18, cracks: 11 },
  { label: "02 Nov", potholes: 22, cracks: 9 },
  { label: "03 Nov", potholes: 31, cracks: 14 },
  { label: "04 Nov", potholes: 27, cracks: 12 },
  { label: "05 Nov", potholes: 35, cracks: 16 },
  { label: "06 Nov", potholes: 29, cracks: 13 },
];

export const mediaComparison = [
  { name: "Images", analyses: 128, detections: 482 },
  { name: "Videos", analyses: 24, detections: 295 },
];
