import { useEffect, useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { DamageMap, type MapPoint } from "@/components/shared/DamageMap";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, fetchTracker } from "@/services/api";
import type { HistoryRecord, RepairStatus, Severity } from "@/types";
import { formatDate } from "@/lib/utils";

export function LiveTrackerPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [repair, setRepair] = useState<"all" | RepairStatus>("all");
  const [from, setFrom] = useState("");
  const [focus, setFocus] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchNote, setSearchNote] = useState("");

  async function load() {
    try {
      const rows = await fetchTracker();
      setRecords(rows);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tracker API is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    return records.filter((row) => {
      const text = `${row.location_name || ""} ${row.filename}`.toLowerCase();
      const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
      const matchesSeverity = severity === "all" || row.severity === severity;
      const matchesRepair = repair === "all" || (row.repair_status || "reported") === repair;
      const matchesDate = !from || row.created_at.slice(0, 10) >= from;
      return matchesQuery && matchesSeverity && matchesRepair && matchesDate && row.latitude != null && row.longitude != null;
    });
  }, [records, query, severity, repair, from]);

  const points: MapPoint[] = filtered.map((row) => ({
    id: row.id,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    severity: row.severity,
    filename: row.filename,
    created_at: row.created_at,
    confidence: row.detections?.[0]?.confidence ?? null,
    repair_status: row.repair_status,
    location_name: row.location_name,
    risk_score: row.risk_score,
  }));

  async function searchPlace() {
    if (!query.trim()) return;
    setSearchNote("Searching OpenStreetMap…");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!data[0]) {
        setSearchNote("No matching city or area found.");
        return;
      }
      setFocus({ latitude: Number(data[0].lat), longitude: Number(data[0].lon) });
      setSearchNote(`Map moved to ${data[0].display_name}. Markers still use only saved detections.`);
    } catch {
      setSearchNote("Place search failed. Check your internet connection.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Live Pothole Tracker</h1>
        <p className="mt-1 text-sm text-slate-400">
          Markers appear only for detections that have real GPS coordinates.
        </p>
      </div>
      <DemoBanner message="Dashboard charts may still show DEMO DATA. This map does not. A pin is created only after you allow GPS or type coordinates." />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input className="pl-9" value={query} placeholder="City, area, or saved location" onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
            <option value="all">All severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm" value={repair} onChange={(e) => setRepair(e.target.value as typeof repair)}>
            <option value="all">All repair status</option>
            <option value="reported">Reported</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In progress</option>
            <option value="repaired">Repaired</option>
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Button className="md:col-span-5" variant="secondary" onClick={searchPlace}>Search area on map</Button>
          {searchNote ? <p className="text-xs text-slate-400 md:col-span-5">{searchNote}</p> : null}
        </CardContent>
      </Card>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      {loading ? <p className="text-sm text-slate-400">Loading saved locations…</p> : null}
      {!loading && points.length === 0 ? (
        <EmptyState icon={MapPin} title="No mapped detections yet" description="Analyze an image with GPS permission or manual coordinates. Demo history is not placed on this map." />
      ) : (
        <DamageMap points={points} focus={focus} />
      )}

      <Card>
        <CardHeader><CardTitle>Saved locations ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((row) => (
            <div key={row.id} className="flex flex-col gap-2 rounded-xl border border-slate-800 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">{row.location_name || row.filename}</p>
                <p className="text-xs text-slate-500">{formatDate(row.created_at)} · {row.latitude}, {row.longitude}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Risk {row.risk_score ?? "—"}</span>
                <SeverityBadge severity={row.severity} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
