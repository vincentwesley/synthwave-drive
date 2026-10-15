import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { Vector2 } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
  const composer = new EffectComposer(renderer);
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.8, 0.6, 0.15);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloom);
  composer.addPass(new OutputPass()); // applies renderer tone mapping + sRGB
  const setSize = (w: number, h: number, dpr: number, level = 0) => {
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    const k = (w < 768 ? 0.5 : 1) * (level > 0 ? 0.5 : 1); // half-res bloom on mobile / reduced quality
    if (k < 1) bloom.setSize(w * dpr * k, h * dpr * k);
  };
  return { composer, bloom, setSize };
}
