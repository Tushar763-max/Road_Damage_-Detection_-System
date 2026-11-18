import { useMemo, useState } from "react";
import {
  Download,
  ImagePlus,
  Loader2,
  MapPin,
  ScanSearch,
  Sparkles,
  UploadCloud,
} from "lucide-react";
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
import { downloadDataUrl } from "@/lib/utils";
import { ApiError, checkHealth, detectImage } from "@/services/api";
import type { ImageDetectionResponse } from "@/types";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

const SAMPLE_IMAGES = [
  { src: "/samples/sample_road_1.jpg", name: "sample_road_1.jpg" },
  { src: "/samples/sample_road_2.jpg", name: "sample_road_2.jpg" },
  { src: "/samples/sample_road_3.jpg", name: "sample_road_3.jpg" },
];

export function ImageDetectionPage() {
  const { addRecord } = useHistoryStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0.15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImageDetectionResponse | null>(null);
  const [place, setPlace] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gpsMessage, setGpsMessage] = useState("");

  const previewUrl = useMemo(() => preview, [preview]);

  function onFile(selected: File | null) {
    setResult(null);
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

  async function loadSample(sampleSrc: string, sampleName: string) {
    setError("");
    setResult(null);
    try {
      const res = await fetch(sampleSrc);
      if (!res.ok) throw new Error("Sample image missing. Refresh or re-run sample setup.");
      const blob = await res.blob();
      const sampleFile = new File([blob], sampleName, { type: blob.type || "image/jpeg" });
      onFile(sampleFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sample image.");
    }
  }

  async function analyze() {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      await checkHealth();
      const lat = parseCoord(latitude);
      const lng = parseCoord(longitude);
      const geo = lat != null && lng != null ? { latitude: lat, longitude: lng, location_name: place || undefined } : place ? { location_name: place } : undefined;
      const res = await detectImage(file, confidence, geo);
      setResult(res);
      addRecord({
        id: res.id,
        type: "image",
        filename: res.filename,
        created_at: new Date().toISOString(),
        total: res.detections.length,
        severity: res.severity,
        detections: res.detections,
        result_url: res.annotated_image,
        source: "model",
        status: "completed",
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not analyze image. Is the Flask backend running?";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Image Detection</h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload road images and run YOLOv8 inference through the Flask API.
        </p>
      </div>

      <DemoBanner message="Upload UI is live. Detection results appear only from the real model — nothing is fabricated when the backend is offline." />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Road Image</CardTitle>
            <CardDescription>JPG, JPEG, PNG · drag & drop or browse</CardDescription>
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
              <p className="text-sm font-medium text-slate-200">Drop image here or click to browse</p>
              <p className="mt-1 text-xs text-slate-500">Max practical size depends on your machine</p>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Quick demo samples (for viva)
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_IMAGES.map((s, i) => (
                  <Button
                    key={s.src}
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    onClick={() => loadSample(s.src, s.name)}
                  >
                    Try sample {i + 1}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence threshold: {confidence.toFixed(2)}</Label>
              <Input
                id="confidence"
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
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <img src={previewUrl} alt="Preview" className="max-h-80 w-full object-contain bg-black" />
              </div>
            ) : (
              <EmptyState
                icon={ImagePlus}
                title="No image selected"
                description="Choose a road surface photo to preview before analysis."
              />
            )}

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <Button className="w-full" onClick={analyze} disabled={!file || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {loading ? "Running YOLOv8…" : "Analyze Image"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detection Results</CardTitle>
            <CardDescription>Annotated output, classes, confidence, and severity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result ? (
              <EmptyState
                icon={ScanSearch}
                title="Waiting for analysis"
                description="Results will show bounding boxes and severity after a successful API call."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">Model Result</Badge>
                  <Badge variant="secondary">{result.detections.length} detections</Badge>
                  <SeverityBadge severity={result.severity} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <p className="border-b border-slate-800 px-3 py-2 text-xs text-slate-400">Original</p>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Original" className="max-h-56 w-full object-contain bg-black" />
                    ) : null}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <p className="border-b border-slate-800 px-3 py-2 text-xs text-slate-400">Detected</p>
                    <img
                      src={result.annotated_image}
                      alt="Detected"
                      className="max-h-56 w-full object-contain bg-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {result.detections.map((d, i) => (
                    <div
                      key={`${d.class_name}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-100">{d.class_name}</p>
                        <p className="text-xs text-slate-500">
                          Confidence {(d.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <SeverityBadge severity={d.severity} />
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadDataUrl(`detected-${result.filename.replace(/\.\w+$/, "")}.jpg`, result.annotated_image)
                  }
                >
                  <Download className="h-4 w-4" />
                  Download Processed Image
                </Button>

                {result.latitude != null && result.longitude != null ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="font-medium text-slate-100">{result.location_name || "Captured Location"}</p>
                      <p className="text-xs text-slate-500">GPS: {result.latitude}, {result.longitude}</p>
                    </div>
                  </div>
                ) : null}

                {result.risk_score != null ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-semibold text-slate-100">{result.risk_score}/100</span>
                    <Badge variant={result.risk_category === "high" ? "danger" : result.risk_category === "medium" ? "warning" : "success"}>
                      {result.risk_category || "low"} risk
                    </Badge>
                  </div>
                ) : null}

                <p className="text-xs text-slate-500">
                  Severity is estimated from bounding-box area and class heuristics — not an official
                  engineering grade.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
