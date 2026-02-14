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
  startTime: string;
  endTime: string;
  odometer: string;
  efficiency: string;
  startBattery: string;
  endBattery: string;
  startRange: string;
  endRange: string;
  locationName: string;
  voltage: string;
  amperage: string;
  kw: string;
  chargedKwh: string;
  cost: string;
  duration: string;
  chargeSpeed: string;
}

export type Theme = "light" | "dark" | "system";
export type Language = "en" | "ja";
export type TabId = "charging" | "history" | "stats" | "settings";

export interface ChargeSpeedBadge {
  emoji: string;
  label: string;
  color: string;
}
