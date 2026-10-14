// Pure spectral-flux onset detector + tempo. No DOM.
export interface BeatOpts {
  sampleRateHz: number; // audio sample rate, used by lowBandRange
  fftSize?: number; // default 2048
  windowSec?: number; // adaptive-threshold window
  k?: number; // threshold = mean + k*sigma
  minFlux?: number; // absolute floor (0..1 scale, mean positive diff per bin)
  refractorySec?: number;
}

/** FFT bin range [lo, hi) covering ~20-150 Hz. */
export function lowBandRange(sampleRateHz: number, fftSize = 2048): [number, number] {
  const hz = sampleRateHz / fftSize;
  return [Math.max(1, Math.ceil(20 / hz)), Math.max(2, Math.floor(150 / hz) + 1)];
}

export function createBeatDetector(o: BeatOpts) {
  const { windowSec = 1, k = 2.5, minFlux = 0.04, refractorySec = 0.25 } = o;
  let prev: Float32Array | null = null;
  const hist: { t: number; f: number }[] = [];
  const onsets: number[] = [];
  let last = -Infinity;

  function push(spec: Float32Array | Uint8Array, t: number): { beat: boolean; flux: number } {
    const scale = spec instanceof Uint8Array ? 1 / 255 : 1;
    let flux = 0;
    if (prev && prev.length === spec.length) {
      for (let i = 0; i < spec.length; i++) {
        const d = spec[i]! * scale - prev[i]!;
        if (d > 0) flux += d;
      }
      flux /= spec.length;
    }
    if (!prev || prev.length !== spec.length) prev = new Float32Array(spec.length);
    for (let i = 0; i < spec.length; i++) prev[i] = spec[i]! * scale;

    while (hist.length && t - hist[0]!.t > windowSec) hist.shift();
    let mean = 0;
    for (const h of hist) mean += h.f;
    mean /= hist.length || 1;
    let v = 0;
    for (const h of hist) v += (h.f - mean) ** 2;
    const sigma = Math.sqrt(v / (hist.length || 1));
    hist.push({ t, f: flux });

    const beat = hist.length > 3 && flux > minFlux && flux > mean + k * sigma && t - last >= refractorySec;
    if (beat) {
      last = t;
      onsets.push(t);
      if (onsets.length > 32) onsets.shift();
    }
    return { beat, flux };
  }

  /** Median inter-onset BPM folded into 70-180; null until 6 onsets. */
  function bpm(): number | null {
    if (onsets.length < 6) return null;
    const iois = onsets.slice(1).map((t, i) => t - onsets[i]!).sort((a, b) => a - b);
    let b = 60 / iois[iois.length >> 1]!;
    while (b < 70) b *= 2;
    while (b > 180) b /= 2;
    return b;
  }

  return { push, bpm };
}
