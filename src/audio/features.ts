// FFT magnitudes (byteFrequencyData) -> smoothed 0..1 band levels + beat pulse.
const BANDS = { bass: [20, 150], mid: [150, 2000], high: [2000, 12000] } as const;

export function createFeatures(sampleRateHz: number, fftSize = 2048) {
  const hz = sampleRateHz / fftSize;
  const range = (b: readonly [number, number]) =>
    [Math.max(1, Math.round(b[0] / hz)), Math.max(2, Math.round(b[1] / hz))] as const;
  const r = { bass: range(BANDS.bass), mid: range(BANDS.mid), high: range(BANDS.high) };
  const out = { bass: 0, mid: 0, high: 0, energy: 0 };
  let p = 0;
  const attackTau = 0.03, releaseTau = 0.25, pulseTau = 0.12;

  function avg(a: Uint8Array, [lo, hi]: readonly [number, number]) {
    const h = Math.min(hi, a.length);
    let s = 0;
    for (let i = lo; i < h; i++) s += a[i]!;
    return h > lo ? s / (h - lo) / 255 : 0;
  }

  function update(bytes: Uint8Array, dt: number) {
    for (const key of ["bass", "mid", "high"] as const) {
      const x = avg(bytes, r[key]);
      const tau = x > out[key] ? attackTau : releaseTau;
      out[key] += (x - out[key]) * (1 - Math.exp(-dt / tau));
    }
    out.energy = Math.min(1, out.bass * 0.5 + out.mid * 0.3 + out.high * 0.2);
    return { ...out };
  }

  function pulse(beat: boolean, dt: number) {
    p = beat ? 1 : p * Math.exp(-dt / pulseTau);
    return p;
  }

  return { update, pulse };
}
