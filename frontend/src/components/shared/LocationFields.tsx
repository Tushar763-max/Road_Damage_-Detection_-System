import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LocationFields({
  place,
  latitude,
  longitude,
  message,
  onPlace,
  onLatitude,
  onLongitude,
  onMessage,
}: {
  place: string;
  latitude: string;
  longitude: string;
  message: string;
  onPlace: (value: string) => void;
  onLatitude: (value: string) => void;
  onLongitude: (value: string) => void;
  onMessage: (value: string) => void;
}) {
  function capture() {
    if (!navigator.geolocation) {
      onMessage("This browser cannot read GPS. Type the coordinates manually.");
      return;
    }
    onMessage("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLatitude(pos.coords.latitude.toFixed(6));
        onLongitude(pos.coords.longitude.toFixed(6));
        onMessage("Coordinates captured from this device.");
      },
      () => onMessage("Permission denied or GPS unavailable. Enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200">Location</p>
        <Button type="button" variant="outline" size="sm" onClick={capture}>
          <LocateFixed className="h-3.5 w-3.5" />
          Use my GPS
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="place">Area or road name</Label>
        <Input
          id="place"
          value={place}
          placeholder="Example: Pune, Baner Road"
          onChange={(e) => onPlace(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            value={latitude}
            placeholder="18.5590"
            onChange={(e) => onLatitude(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            value={longitude}
            placeholder="73.7868"
            onChange={(e) => onLongitude(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {message ||
          "Coordinates are saved only when GPS permission is granted or you type them. Nothing is invented."}
      </p>
    </div>
  );
}

export function parseCoord(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}
