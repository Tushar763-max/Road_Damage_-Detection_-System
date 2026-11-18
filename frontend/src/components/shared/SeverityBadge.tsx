import type { Severity } from "@/types";
import { Badge } from "@/components/ui/badge";

const map = {
  low: { label: "Low", variant: "success" as const },
  medium: { label: "Medium", variant: "warning" as const },
  high: { label: "High", variant: "danger" as const },
};

export function SeverityBadge({ severity }: { severity: Severity | null | undefined }) {
  if (!severity) return <Badge variant="secondary">None</Badge>;
  const item = map[severity];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
