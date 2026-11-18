import { useState, type FormEvent } from "react";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/services/api";

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [organization, setOrganization] = useState(user?.organization ?? "");
  const [confidence, setConfidence] = useState(
    Number(localStorage.getItem("roadscan_default_confidence") || 0.25),
  );
  const [saved, setSaved] = useState(false);

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    updateProfile({ name, organization });
    localStorage.setItem("roadscan_default_confidence", String(confidence));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Profile, defaults, and backend connection info.</p>
      </div>

      <DemoBanner message="Auth is local/demo for now. You can later replace AuthContext with Supabase without rewriting the pages." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Update display details for the dashboard header.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSaveProfile}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization / College</Label>
                <Input
                  id="org"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conf">Default confidence: {confidence.toFixed(2)}</Label>
                <Input
                  id="conf"
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                />
              </div>
              <Button type="submit">Save Settings</Button>
              {saved ? <p className="text-sm text-emerald-400">Saved.</p> : null}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend Connection</CardTitle>
            <CardDescription>Flask inference service configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              API base URL: <code className="text-blue-300">{API_BASE}</code>
            </p>
            <p>Expected endpoints:</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-400">
              <li>POST /api/detect/image</li>
              <li>POST /api/detect/video</li>
              <li>GET /api/history</li>
              <li>GET /api/dashboard/stats</li>
              <li>GET /api/health</li>
            </ul>
            <p className="text-xs text-slate-500">
              Change <code>frontend/.env</code> → <code>VITE_API_BASE_URL</code> if your Flask server
              runs on another host/port.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
