export type Severity = "low" | "medium" | "high";
export type MediaType = "image" | "video" | "complaint";
export type DetectionSource = "demo" | "model";
export type RepairStatus = "reported" | "assigned" | "in_progress" | "repaired";

export interface GeoInput {
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string;
  description?: string;
  owner_email?: string;
}

export interface StatusEvent {
  status: RepairStatus | string;
  at: string;
  note?: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Detection {
  class_name: string;
  confidence: number;
  bbox?: number[] | BoundingBox;
  severity: Severity;
  timestamp?: number;
}

export interface HistoryRecord {
  id: string;
  type: MediaType;
  filename: string;
  created_at: string;
  total: number;
  severity: Severity | null;
  detections: Detection[];
  result_url?: string | null;
  source: DetectionSource;
  status: "completed" | "failed" | "processing";
  preview_label?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  repair_status?: RepairStatus | null;
  risk_score?: number | null;
  risk_category?: Severity | null;
  status_history?: StatusEvent[];
  description?: string | null;
  owner_email?: string | null;
  source_table?: "detection" | "complaint";
  photo_url?: string | null;
}

export interface DashboardStats {
  totalImages: number;
  totalVideos: number;
  totalPotholes: number;
  totalDamagedSegments: number;
  highSeverity: number;
  source: DetectionSource;
}

export interface WeeklyPoint {
  day: string;
  detections: number;
  images: number;
  videos: number;
}

export interface CategoryPoint {
  name: string;
  value: number;
  color: string;
}

export interface SeverityPoint {
  name: string;
  value: number;
  color: string;
}

export interface ImageDetectionResponse {
  id: string;
  filename: string;
  width: number;
  height: number;
  detections: Detection[];
  annotated_image: string;
  severity: Severity | null;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  repair_status?: RepairStatus;
  risk_score?: number;
  risk_category?: Severity;
  model?: string;
}

export interface VideoDetectionResponse {
  id: string;
  filename: string;
  width: number;
  height: number;
  total_detections: number;
  frames_processed: number;
  frames_total?: number;
  stride?: number;
  duration: number;
  detections: Detection[];
  annotated_video: string;
  preview_image?: string | null;
  severity: Severity | null;
  note?: string;
  model?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  repair_status?: RepairStatus;
  risk_score?: number;
  risk_category?: Severity;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization?: string;
}
