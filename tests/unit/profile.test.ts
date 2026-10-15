import { describe, expect, it } from "vitest";
import { createProfile } from "../../src/audio/profile";

const lvl = (e: number) => ({ bass: e, mid: e, high: e, energy: e });
const run = (p: ReturnType<typeof createProfile>, e: number, secs: number) => {
  let r = p.update(lvl(e), 0.016);
  for (let t = 0; t < secs; t += 0.016) r = p.update(lvl(e), 0.016);
  return r;
};

describe("profile", () => {
  it("steady input never surges", () => {
    const p = createProfile();
    const r = run(p, 0.3, 30);
    expect(r.surge).toBe(0);
    expect(r.slowBass).toBeCloseTo(0.3, 2);
    expect(r.variance).toBeLessThan(0.01);
  });
  it("sustained jump surges, then releases when it drops", () => {
    const p = createProfile();
    run(p, 0.2, 20);
    expect(run(p, 0.7, 1).surge).toBe(0); // not yet held long enough
    expect(run(p, 0.7, 2).surge).toBe(1);
    expect(run(p, 0.2, 3).surge).toBe(0);
  });
  it("no surge during warm-up or near silence", () => {
    const p = createProfile();
    run(p, 0.05, 1);
    expect(run(p, 0.6, 5).surge).toBe(0);
    const q = createProfile();
    run(q, 0.01, 20);
    expect(run(q, 0.1, 5).surge).toBe(0);
  });
  it("reset clears", () => {
    const p = createProfile();
    run(p, 0.2, 20);
    run(p, 0.7, 4);
    p.reset();
    const r = p.update(lvl(0.5), 0.016);
    expect(r.surge).toBe(0);
    expect(r.slowBass).toBeCloseTo(0.5, 5);
    expect(r.variance).toBe(0);
  });
  it("ramp from 0 after a source change does not inflate variance or surge", () => {
    const p = createProfile();
    let r = p.update(lvl(0), 0.016);
    for (let t = 0; t < 0.4; t += 0.016) r = p.update(lvl(Math.min(0.5, t * 5)), 0.016);
    r = run(p, 0.5, 20);
    expect(r.variance).toBeLessThan(0.05);
    expect(r.surge).toBe(0);
  });
});
