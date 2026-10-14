import { Mesh, PlaneGeometry, ShaderMaterial } from "three";

const frag = /* glsl */ `
uniform float uBeat; varying vec2 vUv;
void main(){
  vec2 p = (vUv - .5) * 2.0;
  float r = length(p);
  float edge = fwidth(r);
  float disc = 1.0 - smoothstep(1.0 - edge*2.0, 1.0, r);
  float t = (p.y + 1.0) * .5; // 0 bottom .. 1 top
  float u = clamp(t / .7, 0.0, 1.0);
  float f = fract(u * 9.0);
  float g = mix(.55, .06, u); // gap fraction: thick at the bottom, thin higher up
  float aa = fwidth(u * 9.0);
  float cut = (1.0 - smoothstep(g - aa, g + aa, f)) * step(t, .7);
  vec3 col = mix(vec3(1.0,.02,.5), vec3(1.0,.5,.08), smoothstep(.0,.95,t)) * (.85 + uBeat*.35);
  float a = disc * (1.0 - cut);
  if (a < .01) discard;
  gl_FragColor = vec4(pow(col, vec3(2.2)), a);
}`;

export function createSun() {
  const mat = new ShaderMaterial({
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: frag,
    uniforms: { uBeat: { value: 0 } },
    transparent: true,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), mat);
  mesh.position.set(0, 38, -285);
  mesh.scale.setScalar(55);
  mesh.renderOrder = -1;
  return mesh;
}
