export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** World units per second. Base is tempo-locked: one lane-dash period (6 units) passes every half beat, bpm clamped 70..180 (110 if unknown). Energy adds up to +30. */
export const driveSpeed = (energy: number, reduced: boolean, bpm?: number | null) =>
  ((Math.min(180, Math.max(70, bpm ?? 110)) * 12) / 60 + 30 * clamp01(energy)) * (reduced ? 0.4 : 1);

/** Frame-rate independent exponential approach of `cur` toward `target`. */
export const ease = (cur: number, target: number, dt: number, rate = 3) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
