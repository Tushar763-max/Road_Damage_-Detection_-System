import { useEffect, useMemo, useState } from "react";
import { DamageMap, type MapPoint } from "@/components/shared/DamageMap";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, fetchHeatmap, fetchTracker } from "@/services/api";
import { Map } from "lucide-react";

export function HeatmapPage() {
  const [zones, setZones] = useState<MapPoint[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchHeatmap(), fetchTracker()])
      .then(([heat, records]) => {
        const allowed = new Set(
          records
            .filter((row) => !from || row.created_at.slice(0, 10) >= from)
            .filter((row) => !city.trim() || (row.location_name || "").toLowerCase().includes(city.trim().toLowerCase()))
            .map((row) => `${Number(row.latitude).toFixed(2)},${Number(row.longitude).toFixed(2)}`),
        );
        setNames(Array.from(new Set(records.map((r) => r.location_name).filter(Boolean) as string[])));
        setZones(
          heat
            .filter((zone) => allowed.has(`${zone.latitude.toFixed(2)},${zone.longitude.toFixed(2)}`) || (!city && !from))
            .filter((zone) => !city.trim() || (zone.location_name || "").toLowerCase().includes(city.trim().toLowerCase()) || allowed.has(`${zone.latitude.toFixed(2)},${zone.longitude.toFixed(2)}`))
            .map((zone) => ({
              id: `${zone.latitude}-${zone.longitude}`,
              latitude: zone.latitude,
              longitude: zone.longitude,
              zone: zone.zone,
              count: zone.count,
              location_name: zone.location_name,
              filename: zone.location_name || "Damage zone",
            })),
        );
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Heatmap API is unavailable."));
  }, [city, from]);

  const totals = useMemo(
    () => ({
      zones: zones.length,
      detections: zones.reduce((sum, zone) => sum + (zone.count || 0), 0),
    }),
    [zones],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Road Damage Heatmap</h1>
        <p className="mt-1 text-sm text-slate-400">Concentration of stored GPS detections. Green, orange, and red show low, medium, and high density.</p>
      </div>
      <DemoBanner message="Zones are calculated from saved coordinates only. If the map is empty, no detection has a real location yet." />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <Input list="areas" value={city} placeholder="Filter by saved city or area" onChange={(e) => setCity(e.target.value)} />
          <datalist id="areas">{names.map((name) => <option key={name} value={name} />)}</datalist>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </CardContent>
      </Card>
      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {zones.length === 0 ? (
        <EmptyState icon={Map} title="No damage zones yet" description="Capture GPS with an image or complaint before a zone can be drawn." />
      ) : (
        <DamageMap points={zones} heat />
      )}
      <Card>
        <CardHeader><CardTitle>{totals.detections} detections across {totals.zones} zones</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {zones.map((zone) => (
            <p key={zone.id}>{zone.location_name || "Unnamed area"} · {zone.count} detections · {zone.zone} density · {zone.latitude}, {zone.longitude}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
