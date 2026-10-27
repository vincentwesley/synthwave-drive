import { createAudio } from "./audio/input";
import { createEngine } from "./audio/engine";
import { initUi } from "./ui";
import { createScene } from "./scene";

const canvas = document.getElementById("scene") as HTMLCanvasElement;
const audio = createAudio();
const engine = createEngine(audio);
const hud = initUi(audio);

const { setFeatures } = createScene(canvas, {
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  fixedQuality: new URLSearchParams(location.search).get("quality") === "0" ? 0 : undefined, // e2e: keep full quality under slow software GL
});

// Analysis runs on a timer, not rAF, so beat timing stays accurate when rendering is slow.
let surge = "";
setInterval(() => {
  if (document.hidden) return;
  const f = engine.tick(performance.now());
  setFeatures(f);
  hud(f);
  const s = f.surge ? "1" : "0";
  if (s !== surge) { surge = s; document.body.dataset.surge = s; }
}, 16);
