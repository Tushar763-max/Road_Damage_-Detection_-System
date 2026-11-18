import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Camera,
  Gauge,
  History,
  Image,
  Info,
  LayoutDashboard,
  Map,
  MapPin,
  MessageSquarePlus,
  Settings,
  Shield,
  Video,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const groups = [
  {
    label: "Overview",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Detection",
    links: [
      { to: "/detect/image", label: "Image Detection", icon: Image },
      { to: "/detect/video", label: "Video Detection", icon: Video },
      { to: "/live-camera", label: "Live Camera", icon: Camera },
    ],
  },
  {
    label: "Analysis",
    links: [
      { to: "/history", label: "Detection History", icon: History },
      { to: "/analytics", label: "Analytics & Reports", icon: BarChart3 },
      { to: "/live-tracker", label: "Live Tracker", icon: MapPin },
      { to: "/heatmap", label: "Damage Heatmap", icon: Map },
      { to: "/risk-score", label: "Risk Score", icon: Gauge },
    ],
  },
  {
    label: "Management",
    links: [
      { to: "/repairs", label: "Road Repairs", icon: Wrench },
      { to: "/citizen-report", label: "Citizen Report", icon: MessageSquarePlus },
    ],
  },
  {
    label: "System",
    links: [
      { to: "/about", label: "About Project", icon: Info },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#0a101c]/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">RoadScan AI</p>
              <p className="text-xs text-slate-500">Indian Road Damage</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-blue-600/15 text-blue-300 ring-1 ring-blue-500/30"
                          : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4 text-xs text-slate-500">
          MCA Final Year Project · YOLOv8
        </div>
      </aside>
    </>
  );
}

