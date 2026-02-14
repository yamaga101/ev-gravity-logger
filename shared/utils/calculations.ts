import type { ChargeSpeedBadge } from "../types";

export function calcChargedKwh(
  capacity: number,
  startPct: number,
  endPct: number,
): number {
  return (capacity * (endPct - startPct)) / 100;
}

export function calcCost(kwh: number, rate: number): number {
  return Math.round(kwh * rate);
}

export function calcDurationMinutes(
  startIso: string,
  endIso: string,
): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, ms / 60000);
}

export function calcChargeSpeed(kwh: number, durationMin: number): number {
  return durationMin > 0 ? kwh / (durationMin / 60) : 0;
}

export function getChargeSpeedBadge(kw: number): ChargeSpeedBadge {
  if (kw > 20) return { emoji: "\u{1F534}", label: "Rapid", color: "#EF4444" };
  if (kw >= 3) return { emoji: "\u{1F7E1}", label: "Normal", color: "#F59E0B" };
  return { emoji: "\u{1F7E2}", label: "Slow", color: "#22C55E" };
}
