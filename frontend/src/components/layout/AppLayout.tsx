import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, User } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BackendStatus } from "@/components/shared/BackendStatus";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-[#070b14]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium text-slate-100">Indian Road Damage Detection</p>
              <p className="text-xs text-slate-500">Deep Learning · YOLOv8</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <BackendStatus />
            <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 sm:flex">
              <User className="h-4 w-4 text-slate-400" />
              <span className="max-w-[140px] truncate text-xs text-slate-300">
                {user?.name ?? "Guest"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
