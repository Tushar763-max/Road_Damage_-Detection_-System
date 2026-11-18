import { useMemo, useState } from "react";
import { Download, FileText, MapPin, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useHistoryStore } from "@/context/HistoryContext";
import { openInspectionReport } from "@/lib/report";
import { downloadTextFile, formatDate } from "@/lib/utils";
import type { MediaType, Severity } from "@/types";

export function HistoryPage() {
  const { records, removeRecord } = useHistoryStore();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | MediaType>("all");
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || r.filename.toLowerCase().includes(q) || r.id.includes(q);
      const matchesType = type === "all" || r.type === type;
      const matchesSeverity = severity === "all" || r.severity === severity;
      return matchesQuery && matchesType && matchesSeverity;
    });
  }, [records, query, type, severity]);

  const selected = records.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  function onDelete(id: string, source: string) {
    if (source === "demo") {
      alert("Demo records are sample data and cannot be permanently deleted from the catalog.");
      return;
    }
    if (confirm("Delete this history record?")) {
      removeRecord(id);
      if (selectedId === id) setSelectedId(null);
    }
  }

  function exportSelected() {
    if (!selected) return;
    downloadTextFile(
      `${selected.filename}-detections.json`,
      JSON.stringify(selected, null, 2),
      "application/json",
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Detection History</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse past analyses. Demo rows are labeled separately from model results.
        </p>
      </div>

      <DemoBanner />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-9"
              placeholder="Search by file name or id…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-200"
            value={type}
            onChange={(e) => setType(e.target.value as "all" | MediaType)}
          >
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <select
            className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-200"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as "all" | Severity)}
          >
            <option value="all">All severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Records ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching records"
                description="Try clearing filters or run a new detection."
              />
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full flex-col gap-2 rounded-xl border px-3 py-3 text-left transition sm:flex-row sm:items-center sm:justify-between ${
                    selected?.id === item.id
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-100">{item.filename}</p>
                      <Badge variant={item.source === "demo" ? "demo" : "success"}>
                        {item.source}
                      </Badge>
                      <Badge variant="secondary">{item.type}</Badge>
                      {item.repair_status ? (
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {item.repair_status.replace("_", " ")}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(item.created_at)}</span>
                      {item.location_name || (item.latitude != null && item.longitude != null) ? (
                        <span className="flex items-center gap-1 text-blue-400">
                          <MapPin className="h-3 w-3" />
                          <span className="max-w-[140px] truncate sm:max-w-[200px]">
                            {item.location_name || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.risk_score != null ? (
                      <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-slate-300">
                        {item.risk_score} pts
                      </span>
                    ) : null}
                    <span className="text-sm text-slate-400">{item.total}</span>
                    <SeverityBadge severity={item.severity} />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <EmptyState
                icon={Search}
                title="Select a record"
                description="Choose an item from the list to inspect detections."
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-100">{selected.filename}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(selected.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selected.type}</Badge>
                  <Badge variant={selected.source === "demo" ? "demo" : "success"}>
                    {selected.source}
                  </Badge>
                  <SeverityBadge severity={selected.severity} />
                  {selected.repair_status ? (
                    <Badge variant="secondary" className="text-xs uppercase">
                      {selected.repair_status.replace("_", " ")}
                    </Badge>
                  ) : null}
                </div>

                {selected.location_name || (selected.latitude != null && selected.longitude != null) ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-blue-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {selected.location_name || "Tagged Location"}
                      </span>
                      {selected.latitude != null && selected.longitude != null ? (
                        <Link
                          to="/live-tracker"
                          className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300"
                        >
                          View on Tracker
                        </Link>
                      ) : null}
                    </div>
                    {selected.latitude != null && selected.longitude != null ? (
                      <p className="mt-1 text-slate-400 font-mono">
                        GPS: {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {selected.risk_score != null ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                    <span className="text-slate-400">Road Risk Score:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{selected.risk_score}/100</span>
                      <Badge
                        variant={
                          selected.risk_category === "high"
                            ? "danger"
                            : selected.risk_category === "medium"
                              ? "warning"
                              : "success"
                        }
                      >
                        {selected.risk_category || "low"}
                      </Badge>
                    </div>
                  </div>
                ) : null}

                <p className="text-sm text-slate-400">Total detections: {selected.total}</p>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {selected.detections.map((d, i) => (
                    <div
                      key={`${selected.id}-${i}`}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{d.class_name}</span>
                        <SeverityBadge severity={d.severity} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {(d.confidence * 100).toFixed(1)}%
                        {typeof d.timestamp === "number" ? ` · ${d.timestamp}s` : ""}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" onClick={() => openInspectionReport(selected)}>
                    <FileText className="h-4 w-4" />
                    Inspection Report (PDF)
                  </Button>
                  <Button variant="secondary" onClick={exportSelected}>
                    <Download className="h-4 w-4" />
                    JSON
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onDelete(selected.id, selected.source)}
                    disabled={selected.source === "demo"}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={selected.type === "image" ? "/detect/image" : "/detect/video"}>
                      New analysis
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
