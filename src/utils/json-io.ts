import type {
  ChargingRecord,
  ChargingLocation,
  VehicleSettings,
  DriveLogRecord,
  MaintenanceRecord,
  InspectionRecord,
  VehicleRegistration,
  InsuranceRecord,
  TaxRecord,
} from "../types/index.ts";

interface ExportDataV4 {
  version: string;
  exportedAt: string;
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings;
  driveLog?: DriveLogRecord[];
  maintenance?: MaintenanceRecord[];
  inspection?: InspectionRecord[];
  registration?: VehicleRegistration | null;
  insurance?: InsuranceRecord[];
  tax?: TaxRecord[];
}

export interface FullExportInput {
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings;
  driveLog: DriveLogRecord[];
  maintenance: MaintenanceRecord[];
  inspection: InspectionRecord[];
  registration: VehicleRegistration | null;
  insurance: InsuranceRecord[];
  tax: TaxRecord[];
}

export interface FullImportResult {
  history: ChargingRecord[];
  locations: ChargingLocation[];
  settings: VehicleSettings | null;
  driveLog: DriveLogRecord[];
  maintenance: MaintenanceRecord[];
  inspection: InspectionRecord[];
  registration: VehicleRegistration | null;
  insurance: InsuranceRecord[];
  tax: TaxRecord[];
}

export function exportJson(input: FullExportInput): void {
  const data: ExportDataV4 = {
    version: "4.0.0",
    exportedAt: new Date().toISOString(),
    history: input.history,
    locations: input.locations,
    settings: input.settings,
    driveLog: input.driveLog,
    maintenance: input.maintenance,
    inspection: input.inspection,
    registration: input.registration,
    insurance: input.insurance,
    tax: input.tax,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ev-gravity-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isValidChargingRecord(obj: unknown): obj is ChargingRecord {
  if (!obj || typeof obj !== "object") return false;
  const record = obj as Partial<ChargingRecord>;

  return (
    typeof record.id === "string" &&
    typeof record.startTime === "string" &&
    typeof record.odometer === "number" &&
    typeof record.startBattery === "number" &&
    typeof record.startRange === "number" &&
    typeof record.efficiency === "number" &&
    typeof record.startedAt === "number" &&
    typeof record.locationName === "string" &&
    (typeof record.voltage === "number" || typeof record.voltage === "string") &&
    (typeof record.amperage === "number" || typeof record.amperage === "string") &&
    (typeof record.kw === "number" || typeof record.kw === "string") &&
    typeof record.endTime === "string" &&
    typeof record.endBattery === "number" &&
    typeof record.endRange === "number" &&
    typeof record.chargedKwh === "number" &&
    typeof record.cost === "number" &&
    typeof record.duration === "number" &&
    typeof record.chargeSpeed === "number"
  );
}

function isValidChargingLocation(obj: unknown): obj is ChargingLocation {
  if (!obj || typeof obj !== "object") return false;
  const location = obj as Partial<ChargingLocation>;

  return (
    typeof location.id === "string" &&
    typeof location.name === "string" &&
    typeof location.voltage === "number" &&
    typeof location.amperage === "number" &&
    typeof location.kw === "number"
  );
}

function isValidVehicleSettings(obj: unknown): obj is VehicleSettings {
  if (!obj || typeof obj !== "object") return false;
  const settings = obj as Partial<VehicleSettings>;

  return (
    typeof settings.batteryCapacity === "number" &&
    typeof settings.electricityRate === "number" &&
    typeof settings.nightRate === "number" &&
    typeof settings.useNightRate === "boolean" &&
    typeof settings.gasUrl === "string"
  );
}

function isValidDriveLogRecord(obj: unknown): obj is DriveLogRecord {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Partial<DriveLogRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.date === "string" &&
    typeof r.departure === "string" &&
    typeof r.destination === "string" &&
    typeof r.distance === "number" &&
    typeof r.startOdometer === "number" &&
    typeof r.endOdometer === "number" &&
    typeof r.createdAt === "string"
  );
}

function isValidMaintenanceRecord(obj: unknown): obj is MaintenanceRecord {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Partial<MaintenanceRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.date === "string" &&
    typeof r.category === "string" &&
    typeof r.description === "string" &&
    typeof r.cost === "number" &&
    typeof r.createdAt === "string"
  );
}

function isValidInspectionRecord(obj: unknown): obj is InspectionRecord {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Partial<InspectionRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.date === "string" &&
    typeof r.type === "string" &&
    typeof r.odometer === "number" &&
    typeof r.cost === "number" &&
    typeof r.nextDueDate === "string"
  );
}

function isValidVehicleRegistration(obj: unknown): obj is VehicleRegistration {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Partial<VehicleRegistration>;
  return (
    typeof r.plateNumber === "string" &&
    typeof r.vin === "string" &&
    typeof r.model === "string" &&
    typeof r.year === "number" &&
    typeof r.color === "string" &&
    typeof r.expiryDate === "string"
  );
}

function isValidInsuranceRecord(obj: unknown): obj is InsuranceRecord {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Partial<InsuranceRecord>;
  return (
    typeof r.id === "string" &&
    typeof r.provider === "string" &&
    typeof r.policyNumber === "string" &&
    (r.type === "mandatory" || r.type === "voluntary") &&
    typeof r.coverageSummary === "string" &&
    typeof r.premium === "number" &&
    typeof r.startDate === "string" &&
    typeof r.endDate === "string" &&
    typeof r.createdAt === "string"
  );
}

function isValidTaxRecord(obj: unknown): obj is TaxRecord {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Partial<TaxRecord>;
  const validType = r.taxType === "automobile" || r.taxType === "weight" || r.taxType === "env" || r.taxType === "other";
  return (
    typeof r.id === "string" &&
    validType &&
    typeof r.amount === "number" &&
    typeof r.dueDate === "string" &&
    typeof r.fiscalYear === "number" &&
    typeof r.createdAt === "string"
  );
}

function filterValid<T>(arr: unknown, guard: (x: unknown) => x is T): T[] {
  if (!Array.isArray(arr)) return [];
  const result: T[] = [];
  for (const item of arr) {
    if (guard(item)) result.push(item);
  }
  return result;
}

export async function importJson(file: File): Promise<FullImportResult> {
  const text = await file.text();
  const data = JSON.parse(text) as Partial<ExportDataV4>;

  if (data.version && typeof data.version !== "string") {
    throw new Error("Invalid export file: version must be a string");
  }

  return {
    history: filterValid<ChargingRecord>(data.history, isValidChargingRecord),
    locations: filterValid<ChargingLocation>(data.locations, isValidChargingLocation),
    settings: data.settings && isValidVehicleSettings(data.settings) ? data.settings : null,
    driveLog: filterValid<DriveLogRecord>(data.driveLog, isValidDriveLogRecord),
    maintenance: filterValid<MaintenanceRecord>(data.maintenance, isValidMaintenanceRecord),
    inspection: filterValid<InspectionRecord>(data.inspection, isValidInspectionRecord),
    registration: data.registration && isValidVehicleRegistration(data.registration) ? data.registration : null,
    insurance: filterValid<InsuranceRecord>(data.insurance, isValidInsuranceRecord),
    tax: filterValid<TaxRecord>(data.tax, isValidTaxRecord),
  };
}
