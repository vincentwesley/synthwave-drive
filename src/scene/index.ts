import { ACESFilmicToneMapping, Color, SRGBColorSpace, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { ShaderMaterial } from "three";
import { driveSpeed } from "./speed";
import { clamp01, ease, zeroFeatures } from "../util";
import type { Features } from "../util";
import { createLook } from "./look";
import { createPost } from "./post";
import { createQuality } from "./quality";
import { createStars } from "./stars";
import { createSun } from "./sun";
import { createTerrain, FOG } from "./terrain";

export type { Features };
export interface SceneOpts { reducedMotion?: boolean; fixedQuality?: number }

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

  const look = createLook(reduced);
  let f = zeroFeatures(), speed = driveSpeed(0, reduced), travel = 0, time = 0, starTime = 0, last = performance.now(), raf = 0;

  const q = createQuality();
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    const quality = opts.fixedQuality ?? q.level, dpr = quality >= 2 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
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
    const L = look.update(f, dt);
    speed = ease(speed, driveSpeed(f.energy, reduced, f.bpm) * (1 + L.speedBoost), dt);
    travel += speed * dt;
    time += dt;
    starTime += dt * (1 + L.starBoost);
    tu.uTravel!.value = travel; tu.uBeat!.value = L.beat; tu.uMid!.value = clamp01(f.mid);
    tu.uBass!.value = L.bass; tu.uRough!.value = L.rough; tu.uTilt!.value = L.tilt; tu.uSurge!.value = L.surge;
    sunU.uShare!.value = L.share;
    sunU.uBeat!.value = L.beat;
    sun.scale.setScalar(55 * (1 + L.beat * 0.06));
    su.uTime!.value = starTime; su.uHigh!.value = clamp01(f.high);
    post.bloom.strength = Math.min(1.1, 0.7 + L.bloomBeat + L.bloomSurge) * post.gain; // hard cap: worst beat/surge frame must stay contrasty
    camera.position.y = 1.8 + L.camBeat;
    post.composer.render(dt);
  };

  const loop = (now: number) => {
    const raw = (now - last) / 1000, dt = Math.min(raw, 0.1);
    last = now;
    if (opts.fixedQuality === undefined && q.sample(raw) !== null) resize();
    render(dt);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    setFeatures: (next: Partial<Features>) => { f = { ...zeroFeatures(), ...next }; },
    render,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      post.composer.dispose();
      renderer.dispose();
    },
  };
}
