// Slow per-song profile: ~8 s EMAs of band levels, energy variance, and a hysteretic "surge" flag.
export interface ProfileIn { bass: number; mid: number; high: number; energy: number }
export interface Profile extends ProfileIn { variance: number; surge: boolean }

const SLOW_TAU = 8, FAST_TAU = 0.3;
const WARMUP = 10, MIN_ENERGY = 0.12; // no surge before ~10 s of data or on near-silence
const ON_MARGIN = 0.12, ON_HOLD = 2, OFF_MARGIN = 0.04, OFF_HOLD = 1;
const VAR_SCALE = 0.04; // variance of ~0.2 energy swing -> 1

export function createProfile() {
  let s = { bass: 0, mid: 0, high: 0, energy: 0 };
  let age = 0, fast = 0, v = 0, up = 0, down = 0, surge = false, seeded = false;
  const a = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);

  return {
    update(f: ProfileIn, dt: number): Profile {
      if (!seeded) { s = { bass: f.bass, mid: f.mid, high: f.high, energy: f.energy }; fast = f.energy; seeded = true; }
      age += dt;
      const k = a(dt, SLOW_TAU);
      s.bass += (f.bass - s.bass) * k; s.mid += (f.mid - s.mid) * k;
      s.high += (f.high - s.high) * k; s.energy += (f.energy - s.energy) * k;
      fast += (f.energy - fast) * a(dt, FAST_TAU);
      const d = f.energy - s.energy;
      v += (d * d - v) * k;
      if (!surge) {
        up = age > WARMUP && fast > MIN_ENERGY && fast > s.energy + ON_MARGIN ? up + dt : 0;
        if (up > ON_HOLD) { surge = true; down = 0; }
      } else {
        down = fast < s.energy + OFF_MARGIN ? down + dt : 0;
        if (down > OFF_HOLD) { surge = false; up = 0; }
      }
      return { ...s, variance: Math.min(1, v / VAR_SCALE), surge };
    },
    reset() { s = { bass: 0, mid: 0, high: 0, energy: 0 }; age = fast = v = up = down = 0; surge = seeded = false; },
  };
}
