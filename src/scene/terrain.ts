import { Mesh, PlaneGeometry, ShaderMaterial } from "three";

export const FOG = [0.04, 0.016, 0.08] as const;

const vert = /* glsl */ `
uniform float uTravel, uBass, uRough;
varying vec2 vW; varying float vDist; varying float vH;
float hills(vec2 p){
  return sin(p.y*.11+p.x*.31)*.5 + sin(p.y*.23-p.x*.17)*.3 + sin(p.y*.07+p.x*.53+1.7)*.4 + sin(p.y*.41+p.x*.9)*(.12+uRough*.12);
}
void main(){
  vec3 pos = position; // plane rotated: x across, y = -z along after rotation applied in mesh
  vec2 w = vec2(pos.x, pos.y + uTravel); // pattern coords: x, p (p scrolls toward camera)
  float side = smoothstep(3.2, 16.0, abs(pos.x));
  float h = (hills(w)*.5 + .6) * side * 9.0 * (1.0 + uBass*.15);
  vec4 mv = modelViewMatrix * vec4(pos.x, pos.y, h, 1.0);
  vW = w; vH = h; vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform float uBeat, uMid, uTilt, uSurge; uniform vec3 uFog;
varying vec2 vW; varying float vDist; varying float vH;
float line(float c){ float f = fwidth(c); return 1.0 - min(abs(fract(c-.5)-.5)/max(f,1e-4)*.8, 1.0); }
void main(){
  float ax = abs(vW.x);
  vec3 magenta = mix(vec3(1.0,.1,.65), vec3(.6,.2,1.0), uTilt*.5), cyan = vec3(.1,.9,1.0), orange = vec3(1.0,.5,.1);
  vec3 col; 
  if (ax < 3.0) {
    col = vec3(.02,.01,.05);
    float dash = step(fract(vW.y/6.0), .5) * (1.0 - smoothstep(.05,.12,ax));
    col += vec3(1.0,.85,.5) * dash * .9;
    col += cyan * smoothstep(.12,.0,abs(ax-2.85)) * 1.2;
    col += magenta * line(vW.y*.25) * .25;
  } else {
    float g = max(line(vW.x*.5), line(vW.y*.5));
    float far = smoothstep(20.0, 120.0, vDist);
    vec3 lc = mix(magenta, orange, clamp(vH/9.0,0.,1.)*.6 + uMid*.3);
    lc = mix(lc, cyan, smoothstep(30.0, 4.0, ax) * (.4 + uTilt*.25));
    col = vec3(.03,.008,.06) + lc * g * (1.0 + uBeat*1.6 + uSurge*.3) * (1.0 - far*.3);
  }
  float f = smoothstep(40.0, 230.0, vDist);
  gl_FragColor = vec4(pow(mix(col, uFog, f), vec3(2.2)), 1.0);
}`;

export function createTerrain() {
  const geo = new PlaneGeometry(240, 300, 240, 300); // x across, y along (before rotation)
  // keep as-is in object space: x across, y = along, z = height; place with rotation so y -> -z
  const mat = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: { uTravel: { value: 0 }, uBeat: { value: 0 }, uMid: { value: 0 }, uBass: { value: 0 }, uRough: { value: 0 }, uTilt: { value: 0 }, uSurge: { value: 0 }, uFog: { value: FOG } },
  });
  const mesh = new Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2; // object z (height) -> world y; object y -> world -z
  mesh.position.z = -120;
  mesh.frustumCulled = false;
  return mesh;
}
