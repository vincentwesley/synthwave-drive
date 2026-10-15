import { createBeatDetector, lowBandRange } from "./beat";
import { createFeatures } from "./features";
import { createProfile } from "./profile";
import { zeroFeatures, type Features } from "../util";
import type { Audio } from "./input";

export type Frame = Features;

/** tick(nowMs): call once per animation frame (rAF timestamp). beat is a decaying 0..1 pulse. Returns a shared Frame, overwritten each tick: copy to retain. */
export function createEngine(audio: Audio) {
  let bytes = new Uint8Array(1024), bandView = bytes.subarray(1, 2);
  let det: ReturnType<typeof createBeatDetector> | null = null;
  let feat: ReturnType<typeof createFeatures> | null = null;
  const profile = createProfile();
  let lastMs = 0, gen = 0;
  const idle = zeroFeatures(), frame = zeroFeatures();

  return {
    tick(nowMs: number): Frame {
      const an = audio.analyser, ctx = audio.ctx;
      if (!an || !ctx || audio.state === "idle") { lastMs = 0; return idle; }
      if (gen !== audio.gen) { gen = audio.gen; det = feat = null; profile.reset(); lastMs = 0; } // new source: drop old BPM/features
      if (!det || !feat) {
        det = createBeatDetector({ sampleRateHz: ctx.sampleRate });
        feat = createFeatures(ctx.sampleRate);
        const band = lowBandRange(ctx.sampleRate);
        bytes = new Uint8Array(an.frequencyBinCount);
        bandView = bytes.subarray(band[0], band[1]);
      }
      const dt = lastMs ? Math.min(0.1, (nowMs - lastMs) / 1000) : 1 / 60;
      lastMs = nowMs;
      an.getByteFrequencyData(bytes);
      const { beat } = det.push(bandView, nowMs / 1000);
      const f = feat.update(bytes, dt);
      Object.assign(frame, f, profile.update(f, dt));
      frame.beat = feat.pulse(beat, dt); frame.bpm = det.bpm();
      return frame;
    },
  };
}
