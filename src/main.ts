import { createAudio } from "./audio/input";
import { createEngine } from "./audio/engine";
import { createScene } from "./scene";
import { initTheme, initUi } from "./ui";

const canvas = document.getElementById("scene") as HTMLCanvasElement;
const scene = createScene(canvas, { reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });
const audio = createAudio();
const engine = createEngine(audio);
initTheme();
const hud = initUi(audio);

// Analysis runs on a timer, not rAF, so beat timing stays accurate when rendering is slow.
setInterval(() => {
  if (document.hidden) return;
  const f = engine.tick(performance.now());
  scene.setFeatures({ ...f, bpm: f.bpm ?? 110 });
  hud(f);
}, 16);
document.addEventListener("visibilitychange", () => scene.setPaused(document.hidden));
