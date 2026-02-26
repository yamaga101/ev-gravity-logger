import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MaintenanceRecord, InspectionRecord } from "../types/index.ts";

interface MaintenanceState {
  maintenanceRecords: MaintenanceRecord[];
  inspectionRecords: InspectionRecord[];

  // Maintenance CRUD
  addMaintenance: (record: MaintenanceRecord) => void;
  updateMaintenance: (record: MaintenanceRecord) => void;
  deleteMaintenance: (id: string) => void;

  // Inspection CRUD
  addInspection: (record: InspectionRecord) => void;
  updateInspection: (record: InspectionRecord) => void;
  deleteInspection: (id: string) => void;
}

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set) => ({
      maintenanceRecords: [],
      inspectionRecords: [],

      addMaintenance: (record) =>
        set((state) => ({
          maintenanceRecords: [record, ...state.maintenanceRecords],
        })),

      updateMaintenance: (record) =>
        set((state) => ({
          maintenanceRecords: state.maintenanceRecords.map((r) =>
            r.id === record.id ? record : r,
          ),
        })),

      deleteMaintenance: (id) =>
        set((state) => ({
          maintenanceRecords: state.maintenanceRecords.filter((r) => r.id !== id),
        })),

      addInspection: (record) =>
        set((state) => ({
          inspectionRecords: [record, ...state.inspectionRecords],
        })),

      updateInspection: (record) =>
        set((state) => ({
          inspectionRecords: state.inspectionRecords.map((r) =>
            r.id === record.id ? record : r,
          ),
        })),

      deleteInspection: (id) =>
        set((state) => ({
          inspectionRecords: state.inspectionRecords.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "ev-maintenance-v1",
      partialize: (state) => ({
        maintenanceRecords: state.maintenanceRecords,
        inspectionRecords: state.inspectionRecords,
      }),
    },
  ),
);
