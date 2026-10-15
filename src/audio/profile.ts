// Slow per-song profile: ~8 s EMAs of band levels, energy variance, and a hysteretic "surge" flag.
import { ease, type Slow } from "../util";
export interface ProfileIn { bass: number; mid: number; high: number; energy: number }

const SLOW_TAU = 8, FAST_TAU = 0.3;
const WARMUP = 10, MIN_ENERGY = 0.12; // no surge before ~10 s of data or on near-silence
const ON_MARGIN = 0.12, ON_HOLD = 2, OFF_MARGIN = 0.04, OFF_HOLD = 1;
const VAR_SCALE = 0.04; // variance of ~0.2 energy swing -> 1

export function createProfile() {
  const s = { bass: 0, mid: 0, high: 0, energy: 0 };
  const out: Slow = { slowBass: 0, slowMid: 0, slowHigh: 0, variance: 0, surge: 0 };
  let age = 0, fast = 0, v = 0, up = 0, down = 0, surge = false, seeded = false;

  return {
    /** Returns a shared object, overwritten on the next call. */
    update(f: ProfileIn, dt: number): Slow {
      if (!seeded) { Object.assign(s, { bass: f.bass, mid: f.mid, high: f.high, energy: f.energy }); fast = f.energy; seeded = true; }
      age += dt;
      s.bass = ease(s.bass, f.bass, dt, 1 / SLOW_TAU); s.mid = ease(s.mid, f.mid, dt, 1 / SLOW_TAU);
      s.high = ease(s.high, f.high, dt, 1 / SLOW_TAU); s.energy = ease(s.energy, f.energy, dt, 1 / SLOW_TAU);
      fast = ease(fast, f.energy, dt, 1 / FAST_TAU);
      const d = f.energy - s.energy;
      v = ease(v, d * d, dt, 1 / SLOW_TAU);
      if (!surge) {
        up = age > WARMUP && fast > MIN_ENERGY && fast > s.energy + ON_MARGIN ? up + dt : 0;
        if (up > ON_HOLD) { surge = true; down = 0; }
      } else {
        down = fast < s.energy + OFF_MARGIN ? down + dt : 0;
        if (down > OFF_HOLD) { surge = false; up = 0; }
      }
      out.slowBass = s.bass; out.slowMid = s.mid; out.slowHigh = s.high;
      out.variance = Math.min(1, v / VAR_SCALE); out.surge = surge ? 1 : 0;
      return out;
    },
    reset() { age = fast = v = up = down = 0; surge = seeded = false; },
  };
}
