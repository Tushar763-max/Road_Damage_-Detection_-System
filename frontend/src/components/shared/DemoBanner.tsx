import { Info } from "lucide-react";
import { DEMO_BANNER } from "@/data/demo";

export function DemoBanner({ message = DEMO_BANNER }: { message?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
      <p>{message}</p>
    </div>
  );
}
