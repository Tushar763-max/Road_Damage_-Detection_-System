import {
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Layers3,
  Map,
  MapPin,
  MessageSquarePlus,
  ScanSearch,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoCategories, demoSeverity, demoStats, demoWeekly } from "@/data/demo";
import { useHistoryStore } from "@/context/HistoryContext";
import { formatDate } from "@/lib/utils";

export function DashboardPage() {
  const { records } = useHistoryStore();
  const recent = records.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview of road damage detections across images and videos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/live-camera">
              <Camera className="mr-1.5 h-4 w-4 text-blue-400" />
              Live Camera
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/live-tracker">
              <MapPin className="mr-1.5 h-4 w-4 text-emerald-400" />
              Live Tracker
            </Link>
          </Button>
          <Button asChild>
            <Link to="/detect/image">Analyze Image</Link>
          </Button>
        </div>
      </div>

      <DemoBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Images Analyzed"
          value={demoStats.totalImages}
          icon={ImageIcon}
          tone="blue"
          demo
          hint="Includes demo sample count"
        />
        <StatCard
          title="Potholes Detected"
          value={demoStats.totalPotholes}
          icon={ScanSearch}
          tone="red"
          demo
        />
        <StatCard
          title="Damaged Segments"
          value={demoStats.totalDamagedSegments}
          icon={Layers3}
          tone="amber"
          demo
        />
        <StatCard
          title="High Severity"
          value={demoStats.highSeverity}
          icon={AlertTriangle}
          tone="emerald"
          demo
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/live-tracker"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 transition hover:border-blue-500/40 hover:bg-slate-900/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">Live Pothole Tracker</p>
            <p className="text-xs text-slate-400">Interactive OpenStreetMap</p>
          </div>
        </Link>
        <Link
          to="/heatmap"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 transition hover:border-amber-500/40 hover:bg-slate-900/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">Damage Heatmap</p>
            <p className="text-xs text-slate-400">High-density hazard zones</p>
          </div>
        </Link>
        <Link
          to="/repairs"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 transition hover:border-purple-500/40 hover:bg-slate-900/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">Road Repair Orders</p>
            <p className="text-xs text-slate-400">Status & maintenance</p>
          </div>
        </Link>
        <Link
          to="/citizen-report"
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 transition hover:border-emerald-500/40 hover:bg-slate-900/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <MessageSquarePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">Citizen Complaints</p>
            <p className="text-xs text-slate-400">Public photo reporting</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Detection Statistics</CardTitle>
            <CardDescription>Demo trend of detections over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demoWeekly}>
                <defs>
                  <linearGradient id="detFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="detections"
                  stroke="#60a5fa"
                  fill="url(#detFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Low · Medium · High</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demoSeverity} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {demoSeverity.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {demoSeverity.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}: {s.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Damage Distribution</CardTitle>
            <CardDescription>By damage class (demo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoCategories.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{c.name}</span>
                  <span className="text-slate-500">{c.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (c.value / demoCategories[0].value) * 100)}%`,
                      background: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Detection Activity</CardTitle>
              <CardDescription>Latest uploads with detection status</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-100">{item.filename}</p>
                    <Badge variant={item.source === "demo" ? "demo" : "success"}>
                      {item.source === "demo" ? "Demo" : "Model"}
                    </Badge>
                    <Badge variant="secondary">{item.type}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{item.total} detections</span>
                  <SeverityBadge severity={item.severity} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-500">
        Severity shown in this product is a visual estimate from bounding-box size and class type — not
        an official engineering assessment.
      </p>
    </div>
  );
}
