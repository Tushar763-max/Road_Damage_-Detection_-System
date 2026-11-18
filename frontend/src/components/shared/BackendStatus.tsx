import { useEffect, useState } from "react";
import { checkHealth } from "@/services/api";
import { Badge } from "@/components/ui/badge";

type HealthState =
  | { kind: "checking" }
  | { kind: "offline" }
  | { kind: "no-model" }
  | { kind: "online"; model: string };

export function BackendStatus() {
  const [state, setState] = useState<HealthState>({ kind: "checking" });

  useEffect(() => {
    let alive = true;
    const load = () => {
      checkHealth()
        .then((h) => {
          if (!alive) return;
          if (!h.model_loaded) {
            setState({ kind: "no-model" });
            return;
          }
          setState({
            kind: "online",
            model: h.model_path || "YOLOv8",
          });
        })
        .catch(() => {
          if (alive) setState({ kind: "offline" });
        });
    };
    load();
    const timer = window.setInterval(load, 20000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  if (state.kind === "checking") return <Badge variant="secondary">Checking API…</Badge>;
  if (state.kind === "offline") return <Badge variant="danger">Backend Offline</Badge>;
  if (state.kind === "no-model") return <Badge variant="warning">API Up · Model Missing</Badge>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success">Model Online</Badge>
      <Badge variant="secondary" className="max-w-[180px] truncate" title={state.model}>
        {state.model}
      </Badge>
    </div>
  );
}
