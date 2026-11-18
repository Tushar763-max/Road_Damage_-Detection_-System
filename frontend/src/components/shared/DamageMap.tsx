import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  severity?: string | null;
  filename?: string;
  created_at?: string;
  confidence?: number | null;
  repair_status?: string | null;
  location_name?: string | null;
  risk_score?: number | null;
  count?: number;
  zone?: "low" | "medium" | "high";
}

const colors: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

function marker(color: string, label?: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:999px;background:${color};border:2px solid white;box-shadow:0 0 0 4px ${color}55;${label ? "" : ""}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function DamageMap({
  points,
  heat = false,
  focus,
}: {
  points: MapPoint[];
  heat?: boolean;
  focus?: { latitude: number; longitude: number } | null;
}) {
  const node = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!node.current || mapRef.current) return;
    const map = L.map(node.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    points.forEach((point) => {
      const tone = heat ? point.zone || "low" : point.severity || "low";
      const color = colors[tone] || "#3b82f6";
      const radius = heat ? 18 + Math.min(point.count || 1, 8) * 6 : 8;
      const shape = heat
        ? L.circle([point.latitude, point.longitude], {
            radius,
            color,
            weight: 1,
            fillColor: color,
            fillOpacity: 0.35,
          })
        : L.marker([point.latitude, point.longitude], { icon: marker(color) });
      const confidence =
        point.confidence != null ? `${(point.confidence * 100).toFixed(1)}%` : "n/a";
      shape.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;min-width:180px">
          <strong>${point.filename || point.location_name || point.id}</strong><br/>
          ID: ${point.id.slice(0, 8)}<br/>
          ${point.created_at ? `Date: ${new Date(point.created_at).toLocaleString()}<br/>` : ""}
          Severity: ${point.severity || point.zone || "n/a"}<br/>
          Confidence: ${confidence}<br/>
          Repair: ${(point.repair_status || "reported").replace("_", " ")}<br/>
          Risk: ${point.risk_score ?? "n/a"}<br/>
          GPS: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}
          ${point.count ? `<br/>Detections in zone: ${point.count}` : ""}
        </div>`,
      );
      shape.addTo(layer);
    });
    if (focus) {
      map.setView([focus.latitude, focus.longitude], 13);
    } else if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 14);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [30, 30] });
    }
  }, [points, heat, focus]);

  return <div ref={node} className="h-[460px] w-full overflow-hidden rounded-2xl" />;
}
