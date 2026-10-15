import { clamp01 } from "../util";

/** World units per second. Base is tempo-locked: one lane-dash period (6 units) passes every half beat, bpm clamped 70..180 (110 if unknown). Energy adds up to +30. */
export const driveSpeed = (energy: number, reduced: boolean, bpm?: number | null) =>
  ((Math.min(180, Math.max(70, bpm ?? 110)) * 12) / 60 + 30 * clamp01(energy)) * (reduced ? 0.4 : 1);
