export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Frame-rate independent exponential approach of `cur` toward `target`. */
export const ease = (cur: number, target: number, dt: number, rate = 3) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

/** Slow per-song profile; surge is 0..1. All 0 = idle look. */
export interface Slow { slowBass: number; slowMid: number; slowHigh: number; variance: number; surge: number }
export interface Features extends Slow { beat: number; energy: number; bass: number; mid: number; high: number; bpm: number | null }

/** Fresh zero-valued Features (idle look). */
export const zeroFeatures = (): Features =>
  ({ beat: 0, energy: 0, bass: 0, mid: 0, high: 0, bpm: null, slowBass: 0, slowMid: 0, slowHigh: 0, variance: 0, surge: 0 });
