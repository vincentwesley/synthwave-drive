import { createScene } from "./scene";

const canvas = document.getElementById("scene") as HTMLCanvasElement;
createScene(canvas, { reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });
