import { ACESFilmicToneMapping, Color, SRGBColorSpace, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { ShaderMaterial } from "three";
import { clamp01, driveSpeed, ease } from "./speed";
import { createPost } from "./post";
import { createStars } from "./stars";
import { createSun } from "./sun";
import { createTerrain, FOG } from "./terrain";

export interface Features { beat: number; energy: number; bass: number; mid: number; high: number; bpm: number }
export interface SceneOpts { reducedMotion?: boolean }

const defaults = (): Features => ({ beat: 0, energy: 0, bass: 0, mid: 0, high: 0, bpm: 110 });
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

  let f = defaults(), paused = false, speed = driveSpeed(0, reduced), travel = 0, time = 0, last = performance.now(), raf = 0;

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    post.setSize(w, h, dpr);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 85 : 70;
    camera.updateProjectionMatrix();
    su.uPx!.value = dpr;
  };
  resize();
  window.addEventListener("resize", resize);

  const render = (dt = 0) => {
    const beat = reduced ? f.beat * 0.4 : f.beat;
    if (!paused) {
      speed = ease(speed, driveSpeed(f.energy, reduced), dt);
      travel += speed * dt;
      time += dt;
    }
    tu.uTravel!.value = travel; tu.uBeat!.value = beat; tu.uMid!.value = clamp01(f.mid);
    sunU.uBeat!.value = beat;
    sun.scale.setScalar(55 * (1 + beat * 0.06));
    su.uTime!.value = time; su.uHigh!.value = clamp01(f.high);
    post.bloom.strength = 0.8 + (reduced ? 0 : beat * 1.2);
    camera.position.y = 1.8 + (reduced ? 0 : beat * 0.08);
    post.composer.render(dt);
  };

  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    render(dt);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    setFeatures: (next: Partial<Features>) => { f = { ...defaults(), ...next }; },
    setPaused: (b: boolean) => { paused = b; },
    render,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      post.composer.dispose();
      renderer.dispose();
    },
  };
}
