import type { ChargingRecord, GasPayload } from "../types";

export function buildGasPayload(record: ChargingRecord): GasPayload {
  return {
    startTime: String(record.startTime || ""),
    endTime: String(record.endTime || ""),
    odometer: String(record.odometer || ""),
    efficiency: String(record.efficiency || ""),
    startBattery: String(record.startBattery || ""),
    endBattery: String(record.endBattery || ""),
    startRange: String(record.startRange || ""),
    endRange: String(record.endRange || ""),
    locationName: String(record.locationName || ""),
    voltage: String(record.voltage || ""),
    amperage: String(record.amperage || ""),
    kw: String(record.kw || ""),
    chargedKwh: String(record.chargedKwh || ""),
    cost: String(record.cost || ""),
    duration: String(record.duration || ""),
    chargeSpeed: String(record.chargeSpeed || ""),
  };
}

export async function sendToGas(
  gasUrl: string,
  payload: GasPayload,
): Promise<boolean> {
  // Enforce HTTPS for security
  if (!gasUrl.startsWith("https://")) {
    throw new Error("GAS URL must use HTTPS protocol");
  }

  try {
    const resp = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// isOnline is passed as a parameter so this works on both Web and Mobile
export async function retryQueue(
  gasUrl: string,
  queue: GasPayload[],
  isOnline: boolean,
): Promise<{ remaining: GasPayload[]; sentCount: number }> {
  if (queue.length === 0 || !isOnline || !gasUrl) {
    return { remaining: queue, sentCount: 0 };
  }

  const remaining: GasPayload[] = [];
  for (const item of queue) {
    const success = await sendToGas(gasUrl, item);
    if (!success) {
      remaining.push(item);
    }
  }

  return {
    remaining,
    sentCount: queue.length - remaining.length,
  };
}
