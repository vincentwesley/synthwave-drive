import { createAudio } from "./audio/input";
import { createEngine } from "./audio/engine";
import { initTheme, initUi } from "./ui";
import { createScene } from "./scene";
import "./brand/logo-resize";

const canvas = document.getElementById("scene") as HTMLCanvasElement;
const audio = createAudio();
const engine = createEngine(audio);
initTheme();
const hud = initUi(audio);

const { setFeatures } = createScene(canvas, {
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  fixedQuality: ((q) => (q === "0" || q === "1" || q === "2" ? Number(q) : undefined))(new URLSearchParams(location.search).get("quality")), // e2e: pin quality (0 full .. 2 lowest) so adaptive tiers don't flap under software GL
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
