import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoHistory } from "@/data/demo";
import type { HistoryRecord } from "@/types";

interface HistoryContextValue {
  records: HistoryRecord[];
  addRecord: (record: HistoryRecord) => void;
  removeRecord: (id: string) => void;
  getRecord: (id: string) => HistoryRecord | undefined;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);
const STORAGE_KEY = "roadscan_local_history";

function readLocal(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryRecord[]) : [];
  } catch {
    return [];
  }
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [localRecords, setLocalRecords] = useState<HistoryRecord[]>(() => readLocal());

  const value = useMemo<HistoryContextValue>(() => {
    const records = [...localRecords, ...demoHistory].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return {
      records,
      addRecord(record) {
        setLocalRecords((prev) => {
          const next = [record, ...prev.filter((r) => r.id !== record.id)];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      },
      removeRecord(id) {
        setLocalRecords((prev) => {
          const next = prev.filter((r) => r.id !== id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      },
      getRecord(id) {
        return records.find((r) => r.id === id);
      },
    };
  }, [localRecords]);

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistoryStore() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistoryStore must be used within HistoryProvider");
  return ctx;
}
