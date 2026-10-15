import { createBeatDetector, lowBandRange } from "./beat";
import { createFeatures } from "./features";
import { createProfile } from "./profile";
import type { Audio } from "./input";

export interface Frame { beat: number; energy: number; bass: number; mid: number; high: number; bpm: number | null;
  slowBass: number; slowMid: number; slowHigh: number; variance: number; surge: number }

/** tick(nowMs): call once per animation frame (rAF timestamp). beat is a decaying 0..1 pulse. */
export function createEngine(audio: Audio) {
  let bytes = new Uint8Array(1024);
  let det: ReturnType<typeof createBeatDetector> | null = null;
  let feat: ReturnType<typeof createFeatures> | null = null;
  let band: [number, number] = [1, 2];
  const profile = createProfile();
  let lastMs = 0, gen = 0;
  const idle: Frame = { beat: 0, energy: 0, bass: 0, mid: 0, high: 0, bpm: null, slowBass: 0, slowMid: 0, slowHigh: 0, variance: 0, surge: 0 };

  return {
    tick(nowMs: number): Frame {
      const an = audio.analyser, ctx = audio.ctx;
      if (!an || !ctx || audio.state === "idle") return idle;
      if (gen !== audio.gen) { gen = audio.gen; det = feat = null; profile.reset(); } // new source: drop old BPM/features
      if (!det || !feat) {
        det = createBeatDetector({ sampleRateHz: ctx.sampleRate });
        feat = createFeatures(ctx.sampleRate);
        band = lowBandRange(ctx.sampleRate);
        bytes = new Uint8Array(an.frequencyBinCount);
      }
      const dt = lastMs ? Math.min(0.1, (nowMs - lastMs) / 1000) : 1 / 60;
      lastMs = nowMs;
      an.getByteFrequencyData(bytes);
      const { beat } = det.push(bytes.subarray(band[0], band[1]), nowMs / 1000);
      const f = feat.update(bytes, dt);
      const p = profile.update(f, dt);
      return { ...f, beat: feat.pulse(beat, dt), bpm: det.bpm(), slowBass: p.bass, slowMid: p.mid, slowHigh: p.high, variance: p.variance, surge: p.surge ? 1 : 0 };
    },
  };
}
