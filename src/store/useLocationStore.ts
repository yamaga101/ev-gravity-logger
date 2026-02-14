import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChargingLocation } from "../types/index.ts";
import { STORAGE_KEY_LOCATIONS } from "../constants/defaults.ts";
import { generateId } from "../utils/formatting.ts";

interface LocationState {
  locations: ChargingLocation[];
  addLocation: (loc: Omit<ChargingLocation, "id">) => void;
  updateLocation: (id: string, loc: Omit<ChargingLocation, "id">) => void;
  removeLocation: (id: string) => void;
  initFromLegacy: (locations: ChargingLocation[]) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locations: [],

      addLocation: (loc) =>
        set((state) => ({
          locations: [...state.locations, { ...loc, id: generateId() }],
        })),

      updateLocation: (id, loc) =>
        set((state) => ({
          locations: state.locations.map((l) =>
            l.id === id ? { ...loc, id } : l,
          ),
        })),

      removeLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((l) => l.id !== id),
        })),

      initFromLegacy: (locations) => set({ locations }),
    }),
    {
      name: "ev-locations-v3",
      partialize: (state) => ({ locations: state.locations }),
      migrate: (_persisted, version) => {
        if (version === 0) {
          try {
            const raw = localStorage.getItem(STORAGE_KEY_LOCATIONS);
            if (raw) {
              return { locations: JSON.parse(raw) };
            }
          } catch {
            // ignore
          }
        }
        return _persisted;
      },
      version: 1,
    },
  ),
);
