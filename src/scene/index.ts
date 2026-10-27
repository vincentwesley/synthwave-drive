import { ACESFilmicToneMapping, Color, Group, SRGBColorSpace, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { ShaderMaterial, Vector4 } from "three";
import { driveSpeed } from "./speed";
import { clamp01, ease, zeroFeatures } from "../util";
import type { Features } from "../util";
import { createLook } from "./look";
import { createPost } from "./post";
import { createQuality } from "./quality";
import { createStars } from "./stars";
import { createSun } from "./sun";
import { roadCurve, roadSlope } from "./road";
import { createTerrain, FOG, WAVE_IDLE } from "./terrain";

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
  const sky = new Group(); // sun and stars swing with the car's heading on bends
  sky.add(stars, sun);
  scene.add(sky, terrain);
  const post = createPost(renderer, scene, camera);
  const tu = uni(terrain), sunU = uni(sun), su = uni(stars);

  const look = createLook(reduced);
  const waveU = (terrain.material as ShaderMaterial).uniforms.uWaves!.value as Vector4;
  const waves = [WAVE_IDLE, WAVE_IDLE, WAVE_IDLE, WAVE_IDLE];
  const bendAmp = reduced ? 10 : 20;
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
    for (let i = 0; i < 4; i++) waves[i] = Math.min(WAVE_IDLE, waves[i]! + dt);
    waveU.fromArray(waves);
    tu.uBend!.value = bendAmp;
    sky.rotation.y = Math.atan(roadSlope(travel, bendAmp)) * 0.8;
    camera.rotation.z = reduced ? 0 : -roadCurve(travel + 15, bendAmp) * 12; // lean into the bend
    tu.uTravel!.value = travel; tu.uBeat!.value = L.beat; tu.uMid!.value = clamp01(f.mid);
    tu.uBass!.value = L.bass; tu.uRough!.value = L.rough; tu.uTilt!.value = L.tilt; tu.uSurge!.value = L.surge;
    sunU.uShare!.value = L.share;
    sunU.uBeat!.value = L.beat;
    sun.scale.setScalar(55 * (1 + L.beat * 0.1));
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
    setFeatures: (next: Partial<Features>) => {
      const prev = f.beat;
      f = { ...zeroFeatures(), ...next };
      if (!reduced && f.beat > prev + 0.3) { // onset: replace the oldest wave
        const i = waves.indexOf(Math.max(...waves));
        waves[i] = 0;
      }
    },
    render,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      post.composer.dispose();
      renderer.dispose();
    },
  };
}
