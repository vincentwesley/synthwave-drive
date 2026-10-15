import { describe, expect, it } from "vitest";
import { createQuality } from "../../src/scene/quality";

const run = (q: ReturnType<typeof createQuality>, fps: number, secs: number) => {
  const out: number[] = [];
  for (let i = 0; i < fps * secs; i++) { const r = q.sample(1 / fps); if (r !== null) out.push(r); }
  return out;
};

describe("quality", () => {
  it("ignores warm-up and spikes", () => {
    const q = createQuality();
    expect(run(q, 20, 1.9)).toEqual([]);
    expect(q.sample(1)).toBeNull();
  });
  it("steps down after 3s of low fps, then back up after 8s of high", () => {
    const q = createQuality();
    expect(run(q, 20, 8)).toEqual([1]);
    expect(run(q, 20, 6)).toEqual([2]);
    expect(run(q, 20, 20)).toEqual([]); // floor
    expect(run(q, 60, 14)).toEqual([1]);
  });
  it("stays put at healthy fps", () => {
    expect(run(createQuality(), 60, 30)).toEqual([]);
  });
  it("backs off retrying a tier that failed", () => {
    const q = createQuality();
    const moves: number[] = [];
    for (let i = 0; i < 60 * 25; i++) { const r = q.sample(1 / (q.level === 2 ? 60 : 40)); if (r !== null) moves.push(r); }
    expect(moves).toEqual([1, 2, 1, 2]); // one failed retry, then held
    for (let i = 0; i < 60 * 8; i++) expect(q.sample(1 / 60)).toBeNull();
  });
});
