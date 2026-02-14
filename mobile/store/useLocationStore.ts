import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChargingLocation } from "../../shared/types";
import { generateId } from "../../shared/utils/formatting";

interface LocationState {
  locations: ChargingLocation[];
  addLocation: (loc: Omit<ChargingLocation, "id">) => void;
  updateLocation: (id: string, loc: Omit<ChargingLocation, "id">) => void;
  removeLocation: (id: string) => void;
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
    }),
    {
      name: "ev-locations-v3",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ locations: state.locations }),
      version: 1,
    },
  ),
);
