import { describe, expect, it } from "vitest";
import { createFeatures } from "../../src/audio/features";

describe("features", () => {
  it("bass-only spectrum raises bass, not high; releases slowly", () => {
    const f = createFeatures(44100);
    const a = new Uint8Array(1024);
    a.fill(255, 1, 8); // bass bins only
    let o = f.update(a, 1 / 60);
    for (let i = 0; i < 30; i++) o = f.update(a, 1 / 60);
    expect(o.bass).toBeGreaterThan(0.8);
    expect(o.high).toBe(0);
    const o2 = f.update(new Uint8Array(1024), 1 / 60);
    expect(o2.bass).toBeGreaterThan(0.5 * o.bass);
  });
  it("pulse jumps to 1 and decays", () => {
    const f = createFeatures(44100);
    expect(f.pulse(true, 1 / 60)).toBe(1);
    const p = f.pulse(false, 0.12);
    expect(p).toBeLessThan(0.4);
    expect(p).toBeGreaterThan(0);
  });
});
