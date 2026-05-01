import type { RiskLevel } from "../types";

export function calculateTaxiRisk(offeredPrice: number, fairMin: number, fairMax: number, signals: string[]): RiskLevel {
  let score = 0;

  if (offeredPrice > fairMax * 1.5) score += 40;
  if (offeredPrice > fairMax * 2.5) score += 30;
  if (signals.includes("no meter")) score += 20;
  if (signals.includes("cash only")) score += 15;
  if (signals.includes("pressure")) score += 15;
  if (signals.includes("fixed price only")) score += 15;
  if (signals.includes("place closed")) score += 20;
  if (signals.includes("shopping detour")) score += 20;

  if (score >= 70) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export function buildTaxiExplanation(risk: RiskLevel, signals: string[], offeredPrice: number, fairMax: number) {
  if (risk === "High") {
    return `This fare looks unusual compared with the mock fair range. ${offeredPrice} THB is well above ${fairMax} THB, and the selected signals make a reroute or delay recommended.`;
  }

  if (risk === "Medium") {
    return `This ride may still be usable, but the fare and ${signals.length || "some"} signal check should be compared with a meter or ride-hailing estimate first.`;
  }

  return "This looks close to the mock fair range. Keep the meter on, confirm the destination, and save the receipt if needed.";
}
