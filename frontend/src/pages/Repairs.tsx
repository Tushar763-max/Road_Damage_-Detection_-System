import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, fetchComplaints, fetchHistory, updateRepair } from "@/services/api";
import type { HistoryRecord, RepairStatus } from "@/types";
import { formatDate } from "@/lib/utils";

const statuses: RepairStatus[] = ["reported", "assigned", "in_progress", "repaired"];

export function RepairsPage() {
  const [rows, setRows] = useState<HistoryRecord[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const [history, complaints] = await Promise.all([fetchHistory(), fetchComplaints()]);
      const merged = [
        ...history.map((row) => ({ ...row, source_table: "detection" as const })),
        ...complaints.map((row) => ({
          ...row,
          type: "complaint" as const,
          filename: row.filename || "Citizen complaint",
          total: row.detections?.length || 0,
          source: "model" as const,
          status: "completed" as const,
          source_table: "complaint" as const,
        })),
      ];
      setRows(merged.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load repair records.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function change(row: HistoryRecord, status: RepairStatus) {
    setBusy(row.id);
    try {
      await updateRepair(row.source_table === "complaint" ? "complaint" : "detection", row.id, status);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status.");
    } finally {
      setBusy("");
    }
  }

  const urgent = rows.filter((row) => row.severity === "high" && (row.repair_status || "reported") !== "repaired");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Road Repair Management</h1>
        <p className="mt-1 text-sm text-slate-400">Update status for real detection and complaint records.</p>
      </div>
      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      <Card className="border-red-500/30">
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" /> Pending high severity ({urgent.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {urgent.length === 0 ? <p>No open high-severity cases.</p> : urgent.map((row) => (
            <p key={row.id}>{row.location_name || row.filename} · {formatDate(row.created_at)} · {(row.repair_status || "reported").replace("_", " ")}</p>
          ))}
        </CardContent>
      </Card>
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={`${row.source_table}-${row.id}`}>
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium text-slate-100">{row.location_name || row.filename}</p>
                <p className="text-xs text-slate-500">{formatDate(row.created_at)} · {row.type} · Risk {row.risk_score ?? "—"}</p>
                <div className="mt-2"><SeverityBadge severity={row.severity} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Button key={status} size="sm" variant={(row.repair_status || "reported") === status ? "default" : "outline"} disabled={busy === row.id} onClick={() => change(row, status)}>
                    {status.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
