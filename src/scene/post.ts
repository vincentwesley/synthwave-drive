import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { Vector2 } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
  const composer = new EffectComposer(renderer);
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.8, 0.5, 0.4);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloom);
  composer.addPass(new OutputPass()); // applies renderer tone mapping + sRGB
  const post = { composer, bloom, gain: 1, setSize(w: number, h: number, dpr: number, level = 0) {
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    const mobile = w < 768;
    const k = (mobile ? 0.5 : 1) * (level > 0 ? 0.5 : 1); // half-res bloom on mobile / reduced quality
    if (k < 1) bloom.setSize(w * dpr * k, h * dpr * k);
    post.gain = mobile ? 0.4 : 1; // half-res bloom is brighter; level changes keep the same gain so brightness doesn't drift
  } };
  return post;
}
