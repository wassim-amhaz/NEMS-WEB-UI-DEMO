export type VelocityBand = "low" | "medium" | "high";

export const HIGH_VELOCITY_THRESHOLD = 8;
export const MEDIUM_VELOCITY_THRESHOLD = 4;

export function getVelocityBand(velocity: number): VelocityBand {
  if (velocity >= HIGH_VELOCITY_THRESHOLD) return "high";
  if (velocity >= MEDIUM_VELOCITY_THRESHOLD) return "medium";
  return "low";
}

export function getVelocityLabel(velocity: number) {
  const band = getVelocityBand(velocity);
  return band === "high" ? "High" : band === "medium" ? "Medium" : "Low";
}
