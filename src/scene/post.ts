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
  const setSize = (w: number, h: number, dpr: number) => {
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    if (w < 768) bloom.setSize(w * dpr * 0.5, h * dpr * 0.5); // half-res bloom on mobile
  };
  return { composer, bloom, setSize };
}
