import { clamp01, ease, type Slow } from "../util";

export interface LookIn extends Slow { bass: number; beat: number }

/** Eases the slow per-song profile into look parameters, with reduced-motion attenuation applied. All zero when there is no audio. */
export function createLook(reduced: boolean) {
  const s = { bass: 0, tilt: 0, share: 0, rough: 0, surge: 0 };
  const L = { beat: 0, bass: 0, tilt: 0, share: 0, rough: 0, surge: 0, speedBoost: 0, starBoost: 0, bloomBeat: 0, bloomSurge: 0, camBeat: 0 };
  const r = reduced;
  return {
    update(f: LookIn, dt: number) {
      const tot = f.slowBass + f.slowMid + f.slowHigh + 0.05;
      s.bass = ease(s.bass, clamp01(f.bass), dt, 4);
      s.tilt = ease(s.tilt, clamp01((f.slowHigh / (f.slowMid + f.slowHigh + 0.05)) * 2.5), dt, 0.4);
      s.share = ease(s.share, clamp01((f.slowBass / tot) * 1.6), dt, 0.4);
      s.rough = ease(s.rough, clamp01(f.variance), dt, 0.4);
      s.surge = ease(s.surge, clamp01(f.surge), dt, 0.8);
      L.beat = r ? f.beat * 0.4 : f.beat;
      L.bass = r ? s.bass * 0.4 : s.bass;
      L.tilt = s.tilt; L.share = s.share; L.rough = s.rough;
      L.surge = s.surge * (r ? 0.4 : 1);
      L.speedBoost = s.surge * (r ? 0.08 : 0.4);
      L.starBoost = r ? 0 : s.surge * 3;
      L.bloomBeat = r ? 0 : f.beat * 0.3 * (1 - s.surge * 0.7); // overdrive is a sustained accent, so beat flashes ease off to avoid white-out
      L.bloomSurge = s.surge * (r ? 0.01 : 0.03);
      L.camBeat = r ? 0 : f.beat * 0.08;
      return L;
    },
  };
}
