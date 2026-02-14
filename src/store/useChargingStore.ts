import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ChargingRecord,
  ChargingSession,
  GasPayload,
} from "../types/index.ts";
import { STORAGE_KEY_DATA, STORAGE_KEY_SESSION, STORAGE_KEY_QUEUE } from "../constants/defaults.ts";

interface ChargingState {
  history: ChargingRecord[];
  activeSession: ChargingSession | null;
  offlineQueue: GasPayload[];

  // History
  addRecord: (record: ChargingRecord) => void;
  updateRecord: (record: ChargingRecord) => void;
  deleteRecord: (id: string) => void;
  deleteRecords: (ids: string[]) => void;
  deleteAllRecords: () => void;
  importRecords: (records: ChargingRecord[]) => number;

  // Session
  startSession: (session: ChargingSession) => void;
  clearSession: () => void;

  // Offline Queue
  addToQueue: (payload: GasPayload) => void;
  setQueue: (queue: GasPayload[]) => void;

  // Migration
  initFromLegacy: (
    history: ChargingRecord[],
    session: ChargingSession | null,
    queue: GasPayload[],
  ) => void;
}

export const useChargingStore = create<ChargingState>()(
  persist(
    (set, get) => ({
      history: [],
      activeSession: null,
      offlineQueue: [],

      addRecord: (record) =>
        set((state) => ({
          history: [record, ...state.history],
        })),

      updateRecord: (record) =>
        set((state) => ({
          history: state.history.map((h) =>
            h.id === record.id ? record : h,
          ),
        })),

      deleteRecord: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),

      deleteRecords: (ids) =>
        set((state) => ({
          history: state.history.filter((h) => !ids.includes(h.id)),
        })),

      deleteAllRecords: () => set({ history: [] }),

      importRecords: (records) => {
        const existingIds = new Set(get().history.map((h) => h.id));
        const newRecords = records.filter((r) => !existingIds.has(r.id));
        if (newRecords.length > 0) {
          set((state) => ({
            history: [...newRecords, ...state.history],
          }));
        }
        return newRecords.length;
      },

      startSession: (session) => set({ activeSession: session }),

      clearSession: () => set({ activeSession: null }),

      addToQueue: (payload) =>
        set((state) => ({
          offlineQueue: [...state.offlineQueue, payload],
        })),

      setQueue: (queue) => set({ offlineQueue: queue }),

      initFromLegacy: (history, session, queue) =>
        set({ history, activeSession: session, offlineQueue: queue }),
    }),
    {
      name: "ev-charging-v3",
      partialize: (state) => ({
        history: state.history,
        activeSession: state.activeSession,
        offlineQueue: state.offlineQueue,
      }),
      migrate: (_persisted, version) => {
        if (version === 0) {
          // Load legacy data
          let history: ChargingRecord[] = [];
          let activeSession: ChargingSession | null = null;
          let offlineQueue: GasPayload[] = [];

          try {
            const rawHistory = localStorage.getItem(STORAGE_KEY_DATA);
            if (rawHistory) {
              history = JSON.parse(rawHistory).map(
                (record: ChargingRecord) => ({
                  ...record,
                  startBattery:
                    record.startBattery ?? record.battery ?? 0,
                  endBattery:
                    record.endBattery ?? record.batteryAfter ?? 0,
                  startTime:
                    record.startTime ?? record.timestamp ?? "",
                }),
              );
            }
          } catch {
            // ignore
          }

          try {
            const rawSession = localStorage.getItem(STORAGE_KEY_SESSION);
            if (rawSession) activeSession = JSON.parse(rawSession);
          } catch {
            // ignore
          }

          try {
            const rawQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
            if (rawQueue) offlineQueue = JSON.parse(rawQueue);
          } catch {
            // ignore
          }

          return { history, activeSession, offlineQueue };
        }
        return _persisted;
      },
      version: 1,
    },
  ),
);
