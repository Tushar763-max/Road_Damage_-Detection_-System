import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "roadscan_auth_user";

function readStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        if (!email.trim() || password.length < 6) {
          throw new Error("Enter a valid email and password (min 6 characters).");
        }
        const next: UserProfile = {
          id: crypto.randomUUID(),
          name: email.split("@")[0] || "User",
          email,
          organization: "MCA Final Year Project",
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      },
      async register(name, email, password) {
        if (!name.trim() || !email.trim() || password.length < 6) {
          throw new Error("Name, email, and password (min 6 chars) are required.");
        }
        const next: UserProfile = {
          id: crypto.randomUUID(),
          name,
          email,
          organization: "MCA Final Year Project",
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
      updateProfile(patch) {
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...patch };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
