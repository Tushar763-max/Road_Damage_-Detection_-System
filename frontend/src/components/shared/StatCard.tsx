import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "blue" | "red" | "amber" | "emerald";
  demo?: boolean;
}

const tones = {
  blue: "from-blue-500/20 to-transparent text-blue-300",
  red: "from-red-500/20 to-transparent text-red-300",
  amber: "from-amber-500/20 to-transparent text-amber-300",
  emerald: "from-emerald-500/20 to-transparent text-emerald-300",
};

export function StatCard({ title, value, icon: Icon, hint, tone = "blue", demo }: StatCardProps) {
  return (
    <Card className="animate-fade-up overflow-hidden">
      <CardContent className="relative p-5">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", tones[tone])} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">{value}</p>
            {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-2.5">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {demo ? (
          <div className="relative mt-3">
            <Badge variant="demo">Demo</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
