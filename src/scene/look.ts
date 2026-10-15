import { clamp01, ease } from "./speed";

export interface LookIn { bass: number; slowBass: number; slowMid: number; slowHigh: number; variance: number; surge: number }

/** Eases the slow per-song profile into 0..1 look parameters. All zero when there is no audio. */
export function createLook() {
  const s = { bass: 0, tilt: 0, share: 0, rough: 0, surge: 0 };
  return {
    s,
    update(f: LookIn, dt: number) {
      const tot = f.slowBass + f.slowMid + f.slowHigh + 0.05;
      s.bass = ease(s.bass, clamp01(f.bass), dt, 4);
      s.tilt = ease(s.tilt, clamp01((f.slowHigh / (f.slowMid + f.slowHigh + 0.05)) * 2.5), dt, 0.4);
      s.share = ease(s.share, clamp01((f.slowBass / tot) * 1.6), dt, 0.4);
      s.rough = ease(s.rough, clamp01(f.variance), dt, 0.4);
      s.surge = ease(s.surge, clamp01(f.surge), dt, 0.8);
      return s;
    },
  };
}
