import { describe, expect, it } from "vitest";
import { driveSpeed, ease } from "../../src/scene/speed";

describe("speed", () => {
  it("idles at a fixed speed and clamps energy", () => {
    expect(driveSpeed(0, false)).toBeCloseTo(22);
    expect(driveSpeed(5, false)).toBeCloseTo(52);
    expect(driveSpeed(-1, false)).toBeCloseTo(22);
  });
  it("locks to tempo: one 6-unit dash period per half beat, bpm clamped", () => {
    expect(driveSpeed(0, false, 120)).toBeCloseTo(24);
    expect(driveSpeed(0, false, 10)).toBeCloseTo(14);
    expect(driveSpeed(0, false, 999)).toBeCloseTo(36);
    expect(driveSpeed(0, false, null)).toBe(driveSpeed(0, false, 110));
  });
  it("reduced motion is slower", () => expect(driveSpeed(1, true)).toBeLessThan(driveSpeed(1, false)));
  it("ease approaches the target without overshoot", () => {
    const v = ease(0, 10, 0.1);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(10);
    expect(ease(3, 3, 1)).toBe(3);
  });
});
