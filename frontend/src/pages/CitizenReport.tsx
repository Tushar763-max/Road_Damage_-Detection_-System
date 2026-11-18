import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { LocationFields, parseCoord } from "@/components/shared/LocationFields";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDate } from "@/lib/utils";
import {
  absoluteMediaUrl,
  ApiError,
  fetchComplaints,
  submitComplaint,
} from "@/services/api";
import type { HistoryRecord, RepairStatus } from "@/types";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

function getStatusBadge(status?: RepairStatus | string | null) {
  const norm = (status || "reported").toLowerCase().replace(" ", "_");
  switch (norm) {
    case "repaired":
      return <Badge variant="success">Repaired</Badge>;
    case "in_progress":
      return <Badge variant="demo">In Progress</Badge>;
    case "assigned":
      return <Badge variant="default">Assigned</Badge>;
    case "reported":
    default:
      return <Badge variant="warning">Reported</Badge>;
  }
}

export function CitizenReportPage() {
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gpsMessage, setGpsMessage] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [complaints, setComplaints] = useState<HistoryRecord[]>([]);
  const [complaintsError, setComplaintsError] = useState("");

  const [activeTab, setActiveTab] = useState<"submit" | "complaints">("submit");

  const previewUrl = useMemo(() => preview, [preview]);

  function onFile(selected: File | null) {
    setError("");
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED.includes(selected.type) && !/\.(jpe?g|png)$/i.test(selected.name)) {
      setError("Only JPG, JPEG, and PNG images are supported.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function loadComplaints() {
    setComplaintsError("");
    try {
      const list = await fetchComplaints();
      setComplaints(list);
    } catch (err) {
      setComplaintsError(
        err instanceof ApiError
          ? err.message
          : "Could not load citizen complaints. Is the Flask backend running?",
      );
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!place.trim()) {
      setError("Please provide a road or area name.");
      return;
    }

    if (description.trim().length < 8) {
      setError("Please provide a description of at least 8 characters (backend requirement).");
      return;
    }

    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);

    if (latitude.trim() && lat === null) {
      setError("Invalid latitude coordinate. Please enter a valid number or use GPS.");
      return;
    }

    if (longitude.trim() && lng === null) {
      setError("Invalid longitude coordinate. Please enter a valid number or use GPS.");
      return;
    }

    if ((lat != null && lng == null) || (lat == null && lng != null)) {
      setError("Both latitude and longitude must be provided together, or leave both empty.");
      return;
    }

    if (lat != null && (lat < -90 || lat > 90)) {
      setError("Latitude must be between -90 and 90 degrees.");
      return;
    }

    if (lng != null && (lng < -180 || lng > 180)) {
      setError("Longitude must be between -180 and 180 degrees.");
      return;
    }

    setLoading(true);

    try {
      await submitComplaint({
        file,
        description: description.trim(),
        location_name: place.trim(),
        latitude: lat,
        longitude: lng,
        owner_email: user?.email,
      });

      setSuccess(
        "Your road complaint has been submitted successfully! YOLOv8 model analysis and repair tracking record have been created.",
      );
      setFile(null);
      setPreview(null);
      setPlace("");
      setLatitude("");
      setLongitude("");
      setGpsMessage("");
      setDescription("");

      await loadComplaints();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not submit complaint. Is the Flask backend running?";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Citizen Road Report</h1>
        <p className="mt-1 text-sm text-slate-400">
          Report road damage and track repair progress.
        </p>
      </div>

      <DemoBanner message="Citizen reports are sent directly to the local Flask backend and stored in SQLite. YOLOv8 automatically scans uploaded photos for damage upon submission." />

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={activeTab === "submit" ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveTab("submit")}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Submit Complaint
          </Button>
          <Button
            type="button"
            variant={activeTab === "complaints" ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveTab("complaints")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            My Complaints
            {complaints.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 bg-slate-900/60 px-1.5 py-0 text-xs text-slate-300"
              >
                {complaints.length}
              </Badge>
            )}
          </Button>
        </div>
        {activeTab === "complaints" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadComplaints}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        )}
      </div>

      {/* Section 1: Submit Complaint */}
      {activeTab === "submit" && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Photo Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Damage Photo</CardTitle>
              <CardDescription>
                JPG, JPEG, PNG · Drag & drop or browse to attach road damage photo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center transition hover:border-blue-500/50 hover:bg-slate-900/40"
              >
                <UploadCloud className="mb-3 h-8 w-8 text-blue-400" />
                <p className="text-sm font-medium text-slate-200">
                  Drop image here or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  YOLOv8 automatically detects cracks and potholes upon upload
                </p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </label>

              {previewUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black">
                  <img
                    src={previewUrl}
                    alt="Damage photo preview"
                    className="max-h-80 w-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-2 bg-slate-950/80 backdrop-blur"
                    onClick={() => onFile(null)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5 text-red-400" />
                    Remove
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon={ImagePlus}
                  title="No photo attached"
                  description="Upload an image to run automated YOLOv8 road damage detection with your complaint."
                />
              )}
            </CardContent>
          </Card>

          {/* Location & Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Specify location, GPS coordinates, and describe the hazard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocationFields
                place={place}
                latitude={latitude}
                longitude={longitude}
                message={gpsMessage}
                onPlace={setPlace}
                onLatitude={setLatitude}
                onLongitude={setLongitude}
                onMessage={setGpsMessage}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">
                    Complaint Description <span className="text-red-400">*</span>
                  </Label>
                  <span
                    className={cn(
                      "text-xs",
                      description.trim().length >= 8
                        ? "text-emerald-400"
                        : description.length > 0
                        ? "text-amber-400"
                        : "text-slate-500",
                    )}
                  >
                    {description.trim().length} / 8 min chars
                  </span>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  placeholder="Describe the road condition, hazards, approximate size, or landmarks (minimum 8 characters)..."
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-[100px] w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {description.length > 0 && description.trim().length < 8 && (
                  <p className="text-xs text-amber-400">
                    Description must be at least 8 characters long ({8 - description.trim().length} more needed).
                  </p>
                )}
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{success}</span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab("complaints")}
                      className="shrink-0 text-xs"
                    >
                      View in My Complaints
                    </Button>
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                className="w-full"
                onClick={() => handleSubmit()}
                disabled={loading || !place.trim() || description.trim().length < 8}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {loading ? "Submitting Complaint…" : "Submit Complaint"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section 2: My Complaints */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          {complaintsError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-100">Unable to load complaints</p>
                    <p className="mt-0.5 text-xs text-red-200/80">{complaintsError}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={loadComplaints}
                  className="shrink-0 text-xs"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : null}

          {!complaintsError && complaints.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No complaints found"
              description="No road complaints have been submitted yet. Use the 'Submit Complaint' tab to file a new report."
            />
          ) : (
            <div className="grid gap-4">
              {complaints.map((item) => {
                const media = absoluteMediaUrl(item.photo_url);
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-slate-800 transition hover:border-slate-700"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {/* Photo thumbnail */}
                        <div className="relative shrink-0">
                          {media ? (
                            <img
                              src={media}
                              alt={item.location_name || "Complaint photo"}
                              className="h-28 w-28 rounded-xl border border-slate-800 bg-black object-cover sm:h-32 sm:w-32"
                            />
                          ) : (
                            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 text-slate-500 sm:h-32 sm:w-32">
                              <Camera className="mb-1 h-6 w-6 text-slate-600" />
                              <span className="text-[10px] text-slate-500">No Photo</span>
                            </div>
                          )}
                        </div>

                        {/* Complaint Details */}
                        <div className="min-w-0 flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-100">
                                {item.location_name || "Unnamed Location"}
                              </h3>
                              {getStatusBadge(item.repair_status)}
                              <SeverityBadge severity={item.severity} />
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatDate(item.created_at)}
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed text-slate-300">
                            {item.description || "No description provided."}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800/80 pt-2 text-xs text-slate-400">
                            {item.latitude != null && item.longitude != null && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                                {Number(item.latitude).toFixed(4)},{" "}
                                {Number(item.longitude).toFixed(4)}
                              </span>
                            )}

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">Risk Score:</span>
                              <span
                                className={cn(
                                  "font-semibold",
                                  item.risk_score && item.risk_score >= 70
                                    ? "text-red-400"
                                    : item.risk_score && item.risk_score >= 40
                                    ? "text-amber-400"
                                    : "text-emerald-400",
                                )}
                              >
                                {item.risk_score != null ? `${item.risk_score}/100` : "—"}
                              </span>
                              {item.risk_category && (
                                <span className="text-[11px] text-slate-500">
                                  ({item.risk_category})
                                </span>
                              )}
                            </div>

                            {item.detections && item.detections.length > 0 && (
                              <Badge variant="secondary" className="text-[11px]">
                                {item.detections.length} damage{" "}
                                {item.detections.length === 1 ? "box" : "boxes"} detected
                              </Badge>
                            )}

                            {item.owner_email && (
                              <span className="text-[11px] text-slate-500">
                                Reporter: {item.owner_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
