export interface ChargingLocation {
  id: string;
  name: string;
  voltage: number;
  amperage: number;
  kw: number;
}

export interface ChargingSession {
  id: string;
  startTime: string;
  odometer: number;
  startBattery: number;
  startRange: number;
  efficiency: number;
  startedAt: number;
  locationName: string;
  voltage: number | string;
  amperage: number | string;
  kw: number | string;
}

export interface ChargingRecord extends ChargingSession {
  endTime: string;
  endBattery: number;
  endRange: number;
  chargedKwh: number;
  cost: number;
  duration: number;
  chargeSpeed: number;
  // Legacy field names for migration compatibility
  timestamp?: string;
  battery?: number;
  batteryAfter?: number;
}

export interface VehicleSettings {
  batteryCapacity: number;
  electricityRate: number;
  nightRate: number;
  useNightRate: boolean;
  gasUrl: string;
}

export interface GasPayload {
  type: "charging";
  id: string;
  status: "completed";
  startTime: string;
  endTime: string;
  startOdometer: string;
  efficiency: string;
  startSoC: string;
  endSoC: string;
  startRange: string;
  endRange: string;
  location: string;
  addedKwh: string;
  cost: string;
}

export type Theme = "light" | "dark" | "system";
export type Language = "en" | "ja";
export type TabId = "charging" | "history" | "stats" | "settings";

export interface ChargeSpeedBadge {
  emoji: string;
  label: string;
  color: string;
}
