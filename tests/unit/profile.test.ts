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
    expect(r.surge).toBe(false);
    expect(r.energy).toBeCloseTo(0.3, 2);
    expect(r.variance).toBeLessThan(0.01);
  });
  it("sustained jump surges, then releases when it drops", () => {
    const p = createProfile();
    run(p, 0.2, 20);
    expect(run(p, 0.7, 1).surge).toBe(false); // not yet held long enough
    expect(run(p, 0.7, 2).surge).toBe(true);
    expect(run(p, 0.2, 3).surge).toBe(false);
  });
  it("no surge during warm-up or near silence", () => {
    const p = createProfile();
    run(p, 0.05, 1);
    expect(run(p, 0.6, 5).surge).toBe(false);
    const q = createProfile();
    run(q, 0.01, 20);
    expect(run(q, 0.1, 5).surge).toBe(false);
  });
  it("reset clears", () => {
    const p = createProfile();
    run(p, 0.2, 20);
    run(p, 0.7, 4);
    p.reset();
    const r = p.update(lvl(0.5), 0.016);
    expect(r.surge).toBe(false);
    expect(r.energy).toBeCloseTo(0.5, 5);
    expect(r.variance).toBe(0);
  });
});
