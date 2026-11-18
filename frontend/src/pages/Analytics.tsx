import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  demoCategories,
  demoDailyTrend,
  demoSeverity,
  demoWeekly,
  mediaComparison,
} from "@/data/demo";
import { downloadTextFile } from "@/lib/utils";

export function AnalyticsPage() {
  function exportCsv() {
    const rows = [
      ["Day", "Detections", "Images", "Videos"],
      ...demoWeekly.map((d) => [d.day, d.detections, d.images, d.videos]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadTextFile("roadscan-weekly-report.csv", csv, "text/csv");
  }

  function exportPdfLike() {
    const text = [
      "RoadScan AI — Analytics Report (Demo)",
      "====================================",
      "",
      "Weekly detections:",
      ...demoWeekly.map((d) => `${d.day}: ${d.detections}`),
      "",
      "Severity:",
      ...demoSeverity.map((s) => `${s.name}: ${s.value}`),
      "",
      "Note: Demo dataset for UI. Replace with live API aggregates when backend is connected.",
    ].join("\n");
    downloadTextFile("roadscan-analytics-report.txt", text, "text/plain");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Daily, weekly, and category insights for project evaluation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportPdfLike}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <DemoBanner />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Potholes Over Time</CardTitle>
            <CardDescription>Daily demo trend</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demoDailyTrend}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
                />
                <Legend />
                <Line type="monotone" dataKey="potholes" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="cracks" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image vs Video Analysis</CardTitle>
            <CardDescription>Comparison of analyses and detections</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mediaComparison}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
                />
                <Legend />
                <Bar dataKey="analyses" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="detections" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Damage Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demoCategories} dataKey="value" nameKey="name" outerRadius={90}>
                  {demoCategories.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demoSeverity}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {demoSeverity.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
