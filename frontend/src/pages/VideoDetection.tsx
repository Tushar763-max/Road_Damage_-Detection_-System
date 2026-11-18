import { useMemo, useState } from "react";
import { Download, Film, Loader2, MapPin, ScanSearch, UploadCloud } from "lucide-react";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { LocationFields, parseCoord } from "@/components/shared/LocationFields";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHistoryStore } from "@/context/HistoryContext";
import { absoluteMediaUrl, ApiError, checkHealth, detectVideo } from "@/services/api";
import type { VideoDetectionResponse } from "@/types";

export function VideoDetectionPage() {
  const { addRecord } = useHistoryStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0.15);
  const [loading, setLoading] = useState(false);
  const [progressHint, setProgressHint] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VideoDetectionResponse | null>(null);
  const [place, setPlace] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gpsMessage, setGpsMessage] = useState("");

  const previewUrl = useMemo(() => preview, [preview]);
  const outputUrl = useMemo(() => {
    const url = absoluteMediaUrl(result?.annotated_video);
    return url ? `${url}?t=${result?.id ?? ""}` : null;
  }, [result]);

  function onFile(selected: File | null) {
    setResult(null);
    setError("");
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!/\.(mp4|avi|mov)$/i.test(selected.name)) {
      setError("Only MP4, AVI, and MOV videos are supported.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function analyze() {
    if (!file) {
      setError("Please upload a video first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setProgressHint("Checking backend health…");
    try {
      await checkHealth();
      setProgressHint(
        "Scanning video (skipped frames + resized for speed). Short 5–15s clips finish much faster…",
      );
      const lat = parseCoord(latitude);
      const lng = parseCoord(longitude);
      const geo =
        lat != null && lng != null
          ? { latitude: lat, longitude: lng, location_name: place || undefined }
          : place
            ? { location_name: place }
            : undefined;
      const res = await detectVideo(file, confidence, geo);
      setResult(res);
      addRecord({
        id: res.id,
        type: "video",
        filename: res.filename,
        created_at: new Date().toISOString(),
        total: res.total_detections,
        severity: res.severity,
        detections: res.detections,
        result_url: res.annotated_video,
        source: "model",
        status: "completed",
        latitude: res.latitude ?? (lat != null ? lat : undefined),
        longitude: res.longitude ?? (lng != null ? lng : undefined),
        location_name: res.location_name || place || undefined,
        risk_score: res.risk_score,
        risk_category: res.risk_category,
        repair_status: res.repair_status || "reported",
      });
      setProgressHint("Done");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not analyze video. Is the Flask backend running?",
      );
      setProgressHint("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Video Detection</h1>
        <p className="mt-1 text-sm text-slate-400">
          Process road videos and download annotated output. Prefer short clips (5–15 seconds).
        </p>
      </div>

      <DemoBanner message="Tip: long videos are slow on CPU. Use a short road clip. Output is H.264 so it can play in the browser." />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Road Video</CardTitle>
            <CardDescription>MP4, AVI, MOV · short clips recommended</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center transition hover:border-blue-500/50"
            >
              <UploadCloud className="mb-3 h-8 w-8 text-blue-400" />
              <p className="text-sm font-medium text-slate-200">Drop video here or click to browse</p>
              <input
                type="file"
                accept=".mp4,.avi,.mov,video/mp4,video/avi,video/quicktime"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="space-y-2">
              <Label htmlFor="vconf">Confidence threshold: {confidence.toFixed(2)}</Label>
              <Input
                id="vconf"
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
              />
            </div>

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

            {previewUrl ? (
              <video src={previewUrl} controls className="w-full rounded-xl border border-slate-800 bg-black" />
            ) : (
              <EmptyState
                icon={Film}
                title="No video selected"
                description="Choose a short clip for faster local demos."
              />
            )}

            {loading ? (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                <div className="mb-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing on CPU — please wait…
                </div>
                <p className="text-xs text-blue-200/80">{progressHint}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-2/3 animate-pulse-soft rounded-full bg-blue-500" />
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <Button className="w-full" onClick={analyze} disabled={!file || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {loading ? "Analyzing Video…" : "Analyze Video"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Results</CardTitle>
            <CardDescription>Preview frame + playable annotated video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result ? (
              <EmptyState
                icon={ScanSearch}
                title="No processed video yet"
                description="After inference, preview image, video, and detections will appear here."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">Model Result</Badge>
                  <Badge variant="secondary">{result.total_detections} detections</Badge>
                  <Badge variant="secondary">{result.frames_processed} frames analyzed</Badge>
                  {result.stride ? <Badge variant="secondary">every {result.stride} frames</Badge> : null}
                  <SeverityBadge severity={result.severity} />
                </div>

                {result.preview_image ? (
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <p className="border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
                      Preview frame (always shown even if video player fails)
                    </p>
                    <img
                      src={result.preview_image}
                      alt="Annotated preview"
                      className="max-h-64 w-full object-contain bg-black"
                    />
                  </div>
                ) : null}

                {outputUrl ? (
                  <video
                    key={outputUrl}
                    src={outputUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full rounded-xl border border-slate-800 bg-black"
                  />
                ) : null}

                {result.note ? <p className="text-xs text-slate-500">{result.note}</p> : null}

                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {result.detections.slice(0, 40).map((d, i) => (
                    <div
                      key={`${d.class_name}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-100">{d.class_name}</p>
                        <p className="text-xs text-slate-500">
                          {(d.confidence * 100).toFixed(1)}%
                          {typeof d.timestamp === "number" ? ` · t=${d.timestamp}s` : ""}
                        </p>
                      </div>
                      <SeverityBadge severity={d.severity} />
                    </div>
                  ))}
                </div>

                {outputUrl ? (
                  <Button asChild variant="secondary">
                    <a href={outputUrl} download={`detected-${result.filename || "video"}.mp4`}>
                      <Download className="h-4 w-4" />
                      Download Processed Video
                    </a>
                  </Button>
                ) : null}

                {result.latitude != null && result.longitude != null ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="font-medium text-slate-100">{result.location_name || "Captured Location"}</p>
                      <p className="text-xs text-slate-500">
                        GPS: {result.latitude}, {result.longitude}
                      </p>
                    </div>
                  </div>
                ) : null}

                {result.risk_score != null ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-semibold text-slate-100">{result.risk_score}/100</span>
                    <Badge
                      variant={
                        result.risk_category === "high"
                          ? "danger"
                          : result.risk_category === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {result.risk_category || "low"} risk
                    </Badge>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
