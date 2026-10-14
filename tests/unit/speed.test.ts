import { describe, expect, it } from "vitest";
import { driveSpeed, ease } from "../../src/scene/speed";

describe("speed", () => {
  it("idles at a fixed speed and clamps energy", () => {
    expect(driveSpeed(0, false)).toBe(20);
    expect(driveSpeed(5, false)).toBe(50);
    expect(driveSpeed(-1, false)).toBe(20);
  });
  it("reduced motion is slower", () => expect(driveSpeed(1, true)).toBeLessThan(driveSpeed(1, false)));
  it("ease approaches the target without overshoot", () => {
    const v = ease(0, 10, 0.1);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(10);
    expect(ease(3, 3, 1)).toBe(3);
  });
});
