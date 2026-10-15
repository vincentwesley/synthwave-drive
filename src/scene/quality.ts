// Adaptive quality: 0 full, 1 bloom res halved again, 2 also DPR 1.
export const MAX_LEVEL = 2;

export function createQuality() {
  let level = 0, t = 0, ema = 60, low = 0, high = 0;
  /** Feed raw frame dt (s). Returns the new level when it changes, else null. */
  const sample = (dt: number): number | null => {
    if (!(dt > 0) || dt > 0.25) return null; // tab switch / stall: ignore
    t += dt;
    if (t < 2) return null; // warm-up
    ema += (1 / dt - ema) * Math.min(1, dt); // ~1s smoothing
    low = ema < 45 ? low + dt : 0;
    high = ema > 58 ? high + dt : 0;
    let next = level;
    if (low >= 3 && level < MAX_LEVEL) next = level + 1;
    else if (high >= 8 && level > 0) next = level - 1;
    if (next === level) return null;
    level = next; low = high = 0; ema = 50; // neutral so the new level is judged fresh
    return level;
  };
  return { sample };
}
