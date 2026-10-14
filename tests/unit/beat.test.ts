import { describe, expect, it } from "vitest";
import { createBeatDetector } from "../../src/audio/beat";

const FPS = 60, N = 20;
function run(spec: (t: number) => Float32Array, secs: number) {
  const d = createBeatDetector({ sampleRateHz: 44100 });
  let beats = 0;
  for (let i = 0; i < secs * FPS; i++) if (d.push(spec(i / FPS), i / FPS).beat) beats++;
  return { beats, bpm: d.bpm() };
}
const level = (v: number) => new Float32Array(N).fill(v);
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe("beat detector", () => {
  it("finds 120 BPM kicks", () => {
    const { beats, bpm } = run((t) => {
      const ph = t % 0.5; // kick decays over ~0.15s
      return level(0.05 * rnd() + (ph < 0.15 ? 0.9 * (1 - ph / 0.15) : 0));
    }, 10);
    expect(beats).toBeGreaterThanOrEqual(18);
    expect(beats).toBeLessThanOrEqual(21);
    expect(Math.abs(bpm! - 120)).toBeLessThan(3);
  });
  it("silence gives no beats and null bpm", () => {
    const r = run(() => level(0), 5);
    expect(r.beats).toBe(0);
    expect(r.bpm).toBeNull();
  });
  it("steady noise gives no beats", () => {
    expect(run(() => level(0.3 + 0.03 * rnd()), 8).beats).toBe(0);
  });
  it("accepts Uint8Array", () => {
    const d = createBeatDetector({ sampleRateHz: 44100 });
    let b = 0;
    for (let i = 0; i < 120; i++) if (d.push(new Uint8Array(N).fill(i % 30 === 10 ? 230 : 10), i / FPS).beat) b++;
    expect(b).toBeGreaterThan(2);
  });
});
