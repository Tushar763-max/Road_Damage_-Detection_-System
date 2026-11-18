import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Camera,
  CameraOff,
  Download,
  Layers3,
  Loader2,
  Play,
  RefreshCw,
  ScanSearch,
  Square,
} from "lucide-react";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, downloadDataUrl } from "@/lib/utils";
import { ApiError, checkHealth, detectFrame } from "@/services/api";

type CameraStatus =
  | "Requesting permission..."
  | "Camera active"
  | "Permission denied"
  | "Camera not available";

type FrameDetectionResult = Awaited<ReturnType<typeof detectFrame>>;

export function LiveCameraPage() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("Requesting permission...");
  const [detecting, setDetecting] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [lastResult, setLastResult] = useState<FrameDetectionResult | null>(null);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [totalDetections, setTotalDetections] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0.15);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const detectingRef = useRef<boolean>(false);
  const backendOnlineRef = useRef<boolean>(true);
  const confidenceRef = useRef<number>(confidence);

  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);

  useEffect(() => {
    backendOnlineRef.current = backendOnline;
  }, [backendOnline]);

  useEffect(() => {
    detectingRef.current = detecting;
  }, [detecting]);

  const startCamera = useCallback(async () => {
    setError("");
    setCameraStatus("Requesting permission...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("Camera not available");
      setError("Camera API is not supported on this device/browser.");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStream(null);
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch {
        // Fallback to any available video camera (e.g. laptop webcam)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraStatus("Camera active");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const errName = (err as Error)?.name;
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setCameraStatus("Permission denied");
        setError("Camera permission was denied. Please allow camera access in browser settings.");
      } else {
        setCameraStatus("Camera not available");
        setError(
          err instanceof Error
            ? err.message
            : "Camera is not available or is currently in use by another program.",
        );
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStream(null);
      }
    }
  }, []);

  // Poll backend health every 15 seconds
  useEffect(() => {
    let alive = true;
    const verifyHealth = async () => {
      try {
        await checkHealth();
        if (!alive) return;
        setBackendOnline(true);
      } catch {
        if (!alive) return;
        setBackendOnline(false);
      }
    };

    verifyHealth();
    const timer = window.setInterval(verifyHealth, 15000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  // Frame capture function using canvas and detectFrame API
  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    if (isProcessingRef.current) return;
    if (!backendOnlineRef.current) return;

    isProcessingRef.current = true;
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
      });

      if (!blob) return;

      // Real inference via YOLOv8 Flask backend - NEVER simulated
      const res = await detectFrame(blob, confidenceRef.current);

      setLastResult(res);
      setFrameCount((prev) => prev + 1);
      setTotalDetections((prev) => prev + (res.detections ? res.detections.length : 0));
      setError("");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 0 || err.message.toLowerCase().includes("unavailable")) {
          setBackendOnline(false);
        }
        setError(err.message);
      } else {
        setError("Failed to process camera frame through detection model.");
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Detection interval: captures frame every 2 seconds when detecting is true
  useEffect(() => {
    if (detecting && cameraStatus === "Camera active" && backendOnline) {
      captureFrame();

      intervalRef.current = window.setInterval(() => {
        if (detectingRef.current && backendOnlineRef.current) {
          captureFrame();
        }
      }, 2000);
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [detecting, cameraStatus, backendOnline, captureFrame]);

  // Initial camera startup and unmount cleanup
  useEffect(() => {
    startCamera();

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  // Ensure video element receives stream when stream state updates
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Calculate severity breakdown for the latest frame
  const severityBreakdown = useMemo(() => {
    if (!lastResult?.detections) {
      return { low: 0, medium: 0, high: 0 };
    }
    return lastResult.detections.reduce(
      (acc, d) => {
        if (d.severity === "high") acc.high += 1;
        else if (d.severity === "medium") acc.medium += 1;
        else if (d.severity === "low") acc.low += 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0 },
    );
  }, [lastResult]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Live Camera Detection</h1>
        <p className="mt-1 text-sm text-slate-400">
          Real-time road damage detection using your device camera.
        </p>
      </div>

      <DemoBanner message="Live camera inference stream. Frames are captured and processed by the real YOLOv8 model at 2s intervals — nothing is simulated when backend is offline." />

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Camera Section (Left Card) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Camera Stream</CardTitle>
              <CardDescription>Live video preview & frame capture</CardDescription>
            </div>
            <div>
              {cameraStatus === "Camera active" && (
                <Badge variant="success" className="gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Camera active
                </Badge>
              )}
              {cameraStatus === "Requesting permission..." && (
                <Badge variant="warning" className="gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Requesting permission...
                </Badge>
              )}
              {cameraStatus === "Permission denied" && (
                <Badge variant="danger" className="gap-1.5">
                  <CameraOff className="h-3 w-3" />
                  Permission denied
                </Badge>
              )}
              {cameraStatus === "Camera not available" && (
                <Badge variant="secondary" className="gap-1.5">
                  <CameraOff className="h-3 w-3" />
                  Camera not available
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "h-full w-full object-contain bg-black",
                  cameraStatus !== "Camera active" && "hidden",
                )}
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraStatus === "Requesting permission..." && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-400" />
                  <p className="text-sm font-medium text-slate-200">Requesting Camera Access...</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Please grant camera permission when prompted by your browser.
                  </p>
                </div>
              )}

              {cameraStatus === "Permission denied" && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <CameraOff className="mb-2 h-8 w-8 text-red-400" />
                  <p className="text-sm font-medium text-red-200">Camera Permission Denied</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Enable camera permissions in your browser address bar and click Restart Camera.
                  </p>
                </div>
              )}

              {cameraStatus === "Camera not available" && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <CameraOff className="mb-2 h-8 w-8 text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">Camera Not Available</p>
                  <p className="mt-1 text-xs text-slate-500">
                    No camera device was found or another program is using it.
                  </p>
                </div>
              )}

              {cameraStatus === "Camera active" && detecting && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-emerald-400 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Detecting (2s interval)
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="camera-confidence">
                Confidence threshold: {confidence.toFixed(2)}
              </Label>
              <Input
                id="camera-confidence"
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                variant={detecting ? "danger" : "default"}
                onClick={() => setDetecting((prev) => !prev)}
                disabled={cameraStatus !== "Camera active"}
              >
                {detecting ? (
                  <>
                    <Square className="h-4 w-4 fill-current" />
                    Stop Detection
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Start Detection
                  </>
                )}
              </Button>

              {cameraStatus !== "Camera active" && (
                <Button variant="secondary" onClick={startCamera}>
                  <RefreshCw className="h-4 w-4" />
                  Restart Camera
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section (Right Card) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Detection Results</CardTitle>
              <CardDescription>Annotated frame, classes, confidence & severity</CardDescription>
            </div>
            <div>
              {backendOnline ? (
                <Badge variant="success" className="gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Backend Online
                </Badge>
              ) : (
                <Badge variant="danger" className="gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Backend Offline
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!backendOnline && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium">Backend offline - detection paused</p>
                  <p className="text-xs text-red-300/80">
                    Camera preview remains active. Real-time inference will resume once the Flask backend is reachable.
                  </p>
                </div>
              </div>
            )}

            {!lastResult ? (
              <EmptyState
                icon={ScanSearch}
                title={detecting ? "Analyzing camera stream..." : "Waiting for detection"}
                description={
                  detecting
                    ? "Capturing frames every 2 seconds. Detections will appear as road damage is identified."
                    : "Click 'Start Detection' to begin analyzing live camera frames with YOLOv8."
                }
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">Model Result</Badge>
                  <Badge variant="secondary">{lastResult.detections.length} detections</Badge>
                  <SeverityBadge severity={lastResult.severity} />
                  {severityBreakdown.high > 0 && (
                    <Badge variant="danger">{severityBreakdown.high} High</Badge>
                  )}
                  {severityBreakdown.medium > 0 && (
                    <Badge variant="warning">{severityBreakdown.medium} Medium</Badge>
                  )}
                  {severityBreakdown.low > 0 && (
                    <Badge variant="success">{severityBreakdown.low} Low</Badge>
                  )}
                </div>

                {lastResult.annotated_image ? (
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
                      <span>Annotated Frame</span>
                      {detecting && (
                        <span className="flex items-center gap-1.5 text-blue-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                          Live 2s cycle
                        </span>
                      )}
                    </div>
                    <img
                      src={lastResult.annotated_image}
                      alt="Annotated frame"
                      className="max-h-64 w-full object-contain bg-black"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400">
                    Current Detections ({lastResult.detections.length})
                  </p>
                  {lastResult.detections.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-sm text-slate-400">
                      No road damage detected in this frame. Road surface appears clear.
                    </div>
                  ) : (
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {lastResult.detections.map((d, i) => (
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
                  )}
                </div>

                {lastResult.annotated_image ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      downloadDataUrl(`live-frame-${Date.now()}.jpg`, lastResult.annotated_image!)
                    }
                  >
                    <Download className="h-4 w-4" />
                    Download Processed Frame
                  </Button>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Bar (Below cards) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Frames Analyzed"
          value={frameCount}
          icon={Camera}
          tone="blue"
          hint={detecting ? "Sampling every 2 seconds" : "Detection idle"}
        />
        <StatCard
          title="Detections Found"
          value={totalDetections}
          icon={Layers3}
          tone="red"
          hint="Cumulative in current session"
        />
        <StatCard
          title="Current Risk Score"
          value={lastResult?.risk_score != null ? `${lastResult.risk_score} / 100` : "—"}
          icon={Activity}
          tone="amber"
          hint={
            lastResult?.risk_score != null
              ? lastResult.risk_score >= 70
                ? "High risk road section"
                : lastResult.risk_score >= 40
                ? "Moderate road damage"
                : "Low risk road section"
              : "Awaiting analyzed frame"
          }
        />
        <StatCard
          title="Risk Category"
          value={lastResult?.risk_category ? lastResult.risk_category.toUpperCase() : "—"}
          icon={AlertTriangle}
          tone={
            lastResult?.risk_category === "high"
              ? "red"
              : lastResult?.risk_category === "medium"
              ? "amber"
              : "emerald"
          }
          hint={
            lastResult?.risk_category
              ? `${lastResult.risk_category.toUpperCase()} severity level`
              : "No damage detected"
          }
        />
      </div>

      <p className="text-xs text-slate-500">
        Live camera detection performs real-time YOLOv8 inference on camera frames. Severity and risk
        assessments are visual estimates computed from bounding-box size and class type.
      </p>
    </div>
  );
}
