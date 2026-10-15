import { ACESFilmicToneMapping, Color, SRGBColorSpace, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { ShaderMaterial } from "three";
import { clamp01, driveSpeed, ease } from "./speed";
import { createLook } from "./look";
import { createPost } from "./post";
import { createQuality } from "./quality";
import { createStars } from "./stars";
import { createSun } from "./sun";
import { createTerrain, FOG } from "./terrain";

export interface Features { beat: number; energy: number; bass: number; mid: number; high: number; bpm: number;
  /** Slow per-song profile; surge is smoothed 0..1. All 0 = idle look. */
  slowBass: number; slowMid: number; slowHigh: number; variance: number; surge: number }
export interface SceneOpts { reducedMotion?: boolean }

const defaults = (): Features => ({ beat: 0, energy: 0, bass: 0, mid: 0, high: 0, bpm: 110, slowBass: 0, slowMid: 0, slowHigh: 0, variance: 0, surge: 0 });
const uni = (o: { material: unknown }) => (o.material as ShaderMaterial).uniforms as Record<string, { value: number }>;

export function createScene(canvas: HTMLCanvasElement, opts: SceneOpts = {}) {
  const reduced = opts.reducedMotion ?? false;
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setClearColor(new Color().setRGB(FOG[0], FOG[1], FOG[2], SRGBColorSpace));
  const scene = new Scene();
  const camera = new PerspectiveCamera(70, 1, 0.1, 600);
  camera.position.set(0, 1.8, 0);
  camera.rotation.x = -0.04;
  const terrain = createTerrain(), sun = createSun(), stars = createStars();
  scene.add(stars, sun, terrain);
  const post = createPost(renderer, scene, camera);
  const tu = uni(terrain), sunU = uni(sun), su = uni(stars);

  const look = createLook();
  let f = defaults(), speed = driveSpeed(0, reduced), travel = 0, time = 0, starTime = 0, last = performance.now(), raf = 0;

  let quality = 0;
  const pinned = new URLSearchParams(location.search).get("quality") === "0"; // e2e: keep full quality under slow software GL
  const q = createQuality();
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    const dpr = quality >= 2 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    post.setSize(w, h, dpr, quality);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 85 : 70;
    camera.updateProjectionMatrix();
    su.uPx!.value = dpr;
  };
  resize();
  window.addEventListener("resize", resize);

  const render = (dt = 0) => {
    const beat = reduced ? f.beat * 0.4 : f.beat;
    const L = look.update(f, dt);
    speed = ease(speed, driveSpeed(f.energy, reduced, f.bpm) * (1 + L.surge * (reduced ? 0.08 : 0.4)), dt);
    travel += speed * dt;
    time += dt;
    starTime += dt * (1 + L.surge * (reduced ? 0 : 3));
    tu.uTravel!.value = travel; tu.uBeat!.value = beat; tu.uMid!.value = clamp01(f.mid);
    tu.uBass!.value = reduced ? L.bass * 0.4 : L.bass; tu.uRough!.value = L.rough; tu.uTilt!.value = L.tilt; tu.uSurge!.value = L.surge * (reduced ? 0.4 : 1);
    sunU.uShare!.value = L.share;
    sunU.uBeat!.value = beat;
    sun.scale.setScalar(55 * (1 + beat * 0.06));
    su.uTime!.value = starTime; su.uHigh!.value = clamp01(f.high);
    post.bloom.strength = (0.8 + (reduced ? 0 : beat * 1.2) + L.surge * (reduced ? 0.1 : 0.35)) * (canvas.clientWidth < 768 ? 0.4 : 1); // half-res bloom is brighter
    camera.position.y = 1.8 + (reduced ? 0 : beat * 0.08);
    post.composer.render(dt);
  };

  const loop = (now: number) => {
    const raw = (now - last) / 1000, dt = Math.min(raw, 0.1);
    last = now;
    const lv = pinned ? null : q.sample(raw);
    if (lv !== null) { quality = lv; resize(); }
    render(dt);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    setFeatures: (next: Partial<Features>) => { f = { ...defaults(), ...next }; },
    render,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      post.composer.dispose();
      renderer.dispose();
    },
  };
}
