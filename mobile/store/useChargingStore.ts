import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ChargingRecord,
  ChargingSession,
  GasPayload,
} from "../../shared/types";

interface ChargingState {
  history: ChargingRecord[];
  activeSession: ChargingSession | null;
  offlineQueue: GasPayload[];

  addRecord: (record: ChargingRecord) => void;
  updateRecord: (record: ChargingRecord) => void;
  deleteRecord: (id: string) => void;
  deleteRecords: (ids: string[]) => void;
  deleteAllRecords: () => void;
  importRecords: (records: ChargingRecord[]) => number;

  startSession: (session: ChargingSession) => void;
  clearSession: () => void;

  addToQueue: (payload: GasPayload) => void;
  setQueue: (queue: GasPayload[]) => void;
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
    }),
    {
      name: "ev-charging-v3",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        history: state.history,
        activeSession: state.activeSession,
        offlineQueue: state.offlineQueue,
      }),
      version: 1,
    },
  ),
);
