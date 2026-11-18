import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError, fetchHistory } from "@/services/api";
import type { HistoryRecord } from "@/types";
import { cn, formatDate } from "@/lib/utils";

/**
 * Returns risk category details and color mapping for a 0–100 score.
 * Thresholds:
 *   Safe:        0 – 25   (#22c55e)
 *   Low Risk:   26 – 50   (#eab308)
 *   Medium Risk: 51 – 75  (#f59e0b)
 *   High Risk:  76 – 100  (#ef4444)
 */
function getRiskCategory(score: number) {
  if (score <= 25) {
    return {
      label: "Safe",
      range: "0–25",
      color: "#22c55e",
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      pillBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
  }
  if (score <= 50) {
    return {
      label: "Low Risk",
      range: "26–50",
      color: "#eab308",
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      pillBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    };
  }
  if (score <= 75) {
    return {
      label: "Medium Risk",
      range: "51–75",
      color: "#f59e0b",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      pillBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    };
  }
  return {
    label: "High Risk",
    range: "76–100",
    color: "#ef4444",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    pillBg: "bg-red-500/20 text-red-300 border-red-500/30",
  };
}

/** Helper to convert polar coordinates to SVG Cartesian coordinates */
function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const rad = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Helper to generate an SVG arc path between two degree angles */
function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArcFlag = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/** Visual Semicircular SVG Gauge Component */
function SemicircleRiskGauge({ score }: { score: number | null }) {
  const cx = 160;
  const cy = 150;
  const r = 105;

  // 4 arc segments with slight padding for rounded stroke caps
  const segments = [
    { start: 182, end: 223, color: "#22c55e", name: "Safe" },
    { start: 227, end: 268, color: "#eab308", name: "Low" },
    { start: 272, end: 313, color: "#f59e0b", name: "Medium" },
    { start: 317, end: 358, color: "#ef4444", name: "High" },
  ];

  const hasScore = score !== null && !isNaN(score);
  const clampedScore = hasScore ? Math.max(0, Math.min(100, score)) : 0;
  const needleAngle = hasScore ? 180 + (clampedScore / 100) * 180 : null;

  // Needle geometry
  const needleRad = needleAngle !== null ? (needleAngle * Math.PI) / 180 : null;
  const needleLength = 78;
  const tipX = needleRad !== null ? cx + needleLength * Math.cos(needleRad) : cx;
  const tipY = needleRad !== null ? cy + needleLength * Math.sin(needleRad) : cy - needleLength;

  const baseWidth = 6;
  const tailLength = 12;
  const b1Rad = needleRad !== null ? ((needleAngle! - 90) * Math.PI) / 180 : 0;
  const b2Rad = needleRad !== null ? ((needleAngle! + 90) * Math.PI) / 180 : 0;
  const b1X = cx + baseWidth * Math.cos(b1Rad);
  const b1Y = cy + baseWidth * Math.sin(b1Rad);
  const b2X = cx + baseWidth * Math.cos(b2Rad);
  const b2Y = cy + baseWidth * Math.sin(b2Rad);
  const tailX = needleRad !== null ? cx - tailLength * Math.cos(needleRad) : cx;
  const tailY = needleRad !== null ? cy - tailLength * Math.sin(needleRad) : cy + tailLength;

  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center">
      <svg
        viewBox="0 0 320 180"
        className="w-full overflow-visible"
        aria-label={hasScore ? `Risk score gauge: ${clampedScore} out of 100` : "Risk score gauge"}
      >
        <defs>
          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.45" floodColor="#000" />
          </filter>
        </defs>

        {/* Muted background track */}
        <path
          d={describeArc(cx, cy, r, 180, 360)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={18}
          strokeLinecap="round"
        />

        {/* 4 Colored segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={describeArc(cx, cy, r, seg.start, seg.end)}
            fill="none"
            stroke={seg.color}
            strokeWidth={16}
            strokeLinecap="round"
            opacity={hasScore ? 0.95 : 0.3}
            className="transition-all duration-500"
          />
        ))}

        {/* Calibration tick labels */}
        <text x={42} y={166} fill="#64748b" fontSize={11} fontWeight={600} textAnchor="middle">
          0
        </text>
        <text x={160} y={36} fill="#64748b" fontSize={10} fontWeight={500} textAnchor="middle">
          50
        </text>
        <text x={278} y={166} fill="#64748b" fontSize={11} fontWeight={600} textAnchor="middle">
          100
        </text>

        {/* Dynamic needle */}
        {hasScore && needleAngle !== null && (
          <g filter="url(#needleShadow)">
            <polygon
              points={`${tipX.toFixed(2)},${tipY.toFixed(2)} ${b1X.toFixed(2)},${b1Y.toFixed(2)} ${tailX.toFixed(2)},${tailY.toFixed(2)} ${b2X.toFixed(2)},${b2Y.toFixed(2)}`}
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth={1}
            />
            <circle cx={cx} cy={cy} r={8} fill="#0f172a" stroke="#64748b" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={3.5} fill="#60a5fa" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function RiskScorePage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setRecords(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Backend unavailable. Failed to fetch road risk score records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter only records that have actual numeric risk scores and sort descending
  const scoredRecords = useMemo(() => {
    return records
      .filter(
        (r): r is HistoryRecord & { risk_score: number } =>
          typeof r.risk_score === "number" && !isNaN(r.risk_score)
      )
      .sort((a, b) => b.risk_score - a.risk_score);
  }, [records]);

  // Average risk score calculation
  const avgRiskScore = useMemo(() => {
    if (scoredRecords.length === 0) return null;
    const sum = scoredRecords.reduce((acc, r) => acc + r.risk_score, 0);
    return Math.round(sum / scoredRecords.length);
  }, [scoredRecords]);

  // High risk records (risk_score >= 70)
  const highRiskRecords = useMemo(() => {
    return scoredRecords.filter((r) => r.risk_score >= 70);
  }, [scoredRecords]);

  // Total detections with GPS coordinates
  const gpsCount = useMemo(() => {
    return records.filter((r) => r.latitude != null && r.longitude != null).length;
  }, [records]);

  // Repaired count
  const repairedCount = useMemo(() => {
    return records.filter((r) => r.repair_status === "repaired").length;
  }, [records]);

  const activeCategory = avgRiskScore !== null ? getRiskCategory(avgRiskScore) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Road Risk Score
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Estimated road safety risk scores from detection analysis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to="/live-tracker">Live Tracker</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/detect/image">Analyze Image</Link>
          </Button>
        </div>
      </div>

      <DemoBanner />

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Top Stats Row (4 StatCard components) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Average Risk Score"
          value={avgRiskScore !== null ? `${avgRiskScore}/100` : "—"}
          icon={Gauge}
          tone="blue"
          hint={
            avgRiskScore !== null
              ? `${scoredRecords.length} scored ${scoredRecords.length === 1 ? "record" : "records"}`
              : "No risk data"
          }
        />
        <StatCard
          title="High Risk Locations"
          value={highRiskRecords.length}
          icon={AlertTriangle}
          tone="red"
          hint="Risk score ≥ 70"
        />
        <StatCard
          title="Total with GPS"
          value={gpsCount}
          icon={MapPin}
          tone="amber"
          hint="Mapped coordinates"
        />
        <StatCard
          title="Repaired"
          value={repairedCount}
          icon={CheckCircle2}
          tone="emerald"
          hint="Marked as repaired"
        />
      </div>

      {/* Visual Risk Gauge (Big centered card) */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/40">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl">Safety Risk Index</CardTitle>
          <CardDescription>
            Computed risk index based on damage severity, surface area, and density
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-8 pt-2">
          {/* Semicircular SVG Gauge */}
          <SemicircleRiskGauge score={avgRiskScore} />

          {/* Centered Score & Category Label */}
          {avgRiskScore !== null && activeCategory ? (
            <div className="mt-1 text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-6xl font-extrabold tracking-tight text-slate-50">
                  {avgRiskScore}
                </span>
                <span className="text-xl font-medium text-slate-500">/ 100</span>
              </div>
              <div className="mt-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide",
                    activeCategory.bgColor,
                    activeCategory.textColor,
                    activeCategory.borderColor
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: activeCategory.color }}
                  />
                  {activeCategory.label} ({activeCategory.range})
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Calculated average from {scoredRecords.length}{" "}
                {scoredRecords.length === 1 ? "detection record" : "detection records"}
              </p>
            </div>
          ) : (
            <div className="mt-2 text-center">
              <div className="text-4xl font-extrabold tracking-tight text-slate-500">—</div>
              <p className="mt-2 text-base font-semibold text-slate-300">
                No risk data available
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Analyze road images or videos with the detection model to automatically compute road
                safety risk scores.
              </p>
            </div>
          )}

          {/* 4-Tier Category Legend Guide */}
          <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-2.5 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
            <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                Safe
              </div>
              <span className="mt-1 text-xs text-slate-400">0 – 25</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400">
                <span className="h-2 w-2 rounded-full bg-[#eab308]" />
                Low Risk
              </div>
              <span className="mt-1 text-xs text-slate-400">26 – 50</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                Medium Risk
              </div>
              <span className="mt-1 text-xs text-slate-400">51 – 75</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                High Risk
              </div>
              <span className="mt-1 text-xs text-slate-400">76 – 100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Risk Locations Card */}
      <Card className="border-red-500/25 bg-slate-900/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              High Risk Locations
              <Badge variant="danger" className="ml-1.5 font-mono">
                {highRiskRecords.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Detections with road safety risk score ≥ 70 requiring priority maintenance
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/live-tracker" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              Live Tracker
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {highRiskRecords.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No High Risk Locations"
              description="No analyzed locations currently exceed the risk score threshold of 70."
            />
          ) : (
            <div className="space-y-3">
              {highRiskRecords.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-slate-950/60 p-4 transition-colors hover:border-red-500/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-slate-100">
                        {item.location_name || item.filename}
                      </p>
                      {item.location_name && (
                        <span className="truncate text-xs text-slate-500">
                          ({item.filename})
                        </span>
                      )}
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatDate(item.created_at)}</span>
                      <span>•</span>
                      <span>
                        {item.total} {item.total === 1 ? "damage detected" : "damages detected"}
                      </span>
                      {item.latitude != null && item.longitude != null && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-amber-300">
                            <MapPin className="h-3.5 w-3.5 text-amber-400" />
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={item.severity} />
                      <span className="inline-flex items-center rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-1 font-mono text-xs font-bold text-red-300 shadow-sm">
                        Risk {item.risk_score}
                      </span>
                    </div>
                    {item.latitude != null && item.longitude != null && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1 border-slate-700 hover:bg-slate-800"
                      >
                        <Link to="/live-tracker">
                          <MapPin className="h-3.5 w-3.5 text-amber-400" />
                          Track
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Detections Risk Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-400" />
              All Detections Risk Ranking
              <Badge variant="secondary" className="ml-1.5 font-mono">
                {scoredRecords.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive ranking of road analyses sorted by risk score descending
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {scoredRecords.length === 0 ? (
            <EmptyState
              icon={Gauge}
              title="No Scored Detections"
              description="No road detection records with risk scores are available yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-3 font-semibold">Location / File</th>
                    <th className="pb-3 px-3 font-semibold text-center">Risk Score</th>
                    <th className="pb-3 px-3 font-semibold">Category</th>
                    <th className="pb-3 px-3 font-semibold">Severity</th>
                    <th className="pb-3 px-3 font-semibold text-center">Detections Count</th>
                    <th className="pb-3 pr-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scoredRecords.map((item) => {
                    const cat = getRiskCategory(item.risk_score);
                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-900/50"
                      >
                        <td className="py-3.5 pl-3">
                          <div className="min-w-[180px]">
                            <p className="font-medium text-slate-100">
                              {item.location_name || item.filename}
                            </p>
                            {item.location_name && (
                              <p className="text-xs text-slate-500">{item.filename}</p>
                            )}
                            {item.latitude != null && item.longitude != null && (
                              <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-amber-400/90">
                                <MapPin className="h-3 w-3" />
                                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={cn(
                              "inline-flex min-w-[3rem] items-center justify-center rounded-lg border px-2.5 py-1 font-mono text-xs font-bold shadow-sm",
                              cat.pillBg
                            )}
                          >
                            {item.risk_score}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs font-semibold",
                              cat.textColor
                            )}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-sm text-slate-300">
                          {item.total}
                        </td>
                        <td className="py-3.5 pr-3 text-right text-xs text-slate-400">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-slate-500">
        This is an estimated software-generated score based on detection severity, bounding-box
        area, and damage density. It is not an official engineering safety assessment.
      </p>
    </div>
  );
}
