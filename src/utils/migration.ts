import {
  STORAGE_KEY_DATA,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_SESSION,
  STORAGE_KEY_LOCATIONS,
  STORAGE_KEY_QUEUE,
  STORAGE_KEY_ONBOARDING,
  STORAGE_KEY_LANG,
} from "../constants/defaults.ts";
import type {
  ChargingRecord,
  VehicleSettings,
  ChargingSession,
  ChargingLocation,
  GasPayload,
  Language,
} from "../types/index.ts";

const MIGRATION_FLAG = "ev_gravity_migrated_v3";

interface MigrationResult {
  history: ChargingRecord[];
  settings: Partial<VehicleSettings>;
  session: ChargingSession | null;
  locations: ChargingLocation[];
  offlineQueue: GasPayload[];
  onboardingDone: boolean;
  lang: Language;
}

function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function needsMigration(): boolean {
  return !localStorage.getItem(MIGRATION_FLAG);
}

export function loadLegacyData(): MigrationResult {
  const history = safeJsonParse<ChargingRecord[]>(STORAGE_KEY_DATA, []);
  const rawSettings = safeJsonParse<Partial<VehicleSettings>>(
    STORAGE_KEY_SETTINGS,
    {},
  );
  const session = safeJsonParse<ChargingSession | null>(
    STORAGE_KEY_SESSION,
    null,
  );
  const locations = safeJsonParse<ChargingLocation[]>(
    STORAGE_KEY_LOCATIONS,
    [],
  );
  const offlineQueue = safeJsonParse<GasPayload[]>(STORAGE_KEY_QUEUE, []);
  const onboardingDone =
    localStorage.getItem(STORAGE_KEY_ONBOARDING) === "true";
  const lang = (localStorage.getItem(STORAGE_KEY_LANG) || "en") as Language;

  // Normalize legacy field names
  const normalizedHistory = history.map((record) => ({
    ...record,
    startBattery: record.startBattery ?? record.battery ?? 0,
    endBattery: record.endBattery ?? record.batteryAfter ?? 0,
    startTime: record.startTime ?? record.timestamp ?? "",
  }));

  return {
    history: normalizedHistory,
    settings: rawSettings,
    session,
    locations,
    offlineQueue,
    onboardingDone,
    lang,
  };
}

export function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_FLAG, "true");
}
