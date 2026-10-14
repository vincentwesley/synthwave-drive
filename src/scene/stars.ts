import { BufferAttribute, BufferGeometry, Points, ShaderMaterial } from "three";

export function createStars(count = 700) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, e = 0.03 + Math.random() * 0.9, r = 400;
    pos.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.abs(Math.sin(a)) * Math.cos(e) * r - 20], i * 3);
    seed[i] = Math.random() * 6.28;
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new BufferAttribute(seed, 1));
  const mat = new ShaderMaterial({
    vertexShader: `attribute float aSeed; uniform float uTime, uHigh, uPx; varying float vA;
      void main(){ float tw = .5 + .5*sin(uTime*(1.5+uHigh*6.0)+aSeed*7.0); vA = .35 + .65*mix(.6, tw, .3+uHigh*.7);
      gl_PointSize = (1.5 + fract(aSeed)*1.8) * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: "varying float vA; void main(){ gl_FragColor = vec4(pow(vec3(.8,.85,1.0)*vA, vec3(2.2)), 1.0); }",
    uniforms: { uTime: { value: 0 }, uHigh: { value: 0 }, uPx: { value: 1 } },
    depthWrite: false,
  });
  const pts = new Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = -2;
  return pts;
}
