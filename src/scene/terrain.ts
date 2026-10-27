import { Mesh, PlaneGeometry, ShaderMaterial, Vector4 } from "three";
import { ROAD_GLSL } from "./road";

export const FOG = [0.04, 0.016, 0.08] as const;

/** Beat waves: each kick launches a band of light from the car toward the horizon. uWaves holds the ages (s) of the last four. */
export const WAVE_SPEED = 90, WAVE_IDLE = 99;

const vert = /* glsl */ `
uniform float uTravel, uBass, uRough, uBend;
varying vec2 vW; varying float vDist; varying float vH; varying float vAhead;
${ROAD_GLSL}
float hills(vec2 p){
  return sin(p.y*.11+p.x*.31)*.5 + sin(p.y*.23-p.x*.17)*.3 + sin(p.y*.07+p.x*.53+1.7)*.4 + sin(p.y*.41+p.x*.9)*(.12+uRough*.12);
}
void main(){
  vec3 pos = position; // object space: x across, y along (world -z), z up
  vec2 w = vec2(pos.x, pos.y + uTravel); // pattern coords scroll toward the camera
  float side = smoothstep(3.2, 16.0, abs(pos.x));
  float h = (hills(w)*.5 + .6) * side * 9.0 * (1.0 + uBass*.15);
  // bend the world along the road, relative to the car's position and heading so the road under the car stays straight
  float d = pos.y + 120.0, s0 = uTravel; // d = distance ahead of the car
  float bend = roadX(s0 + d, uBend) - roadX(s0, uBend) - d * roadDX(s0, uBend);
  vec4 mv = modelViewMatrix * vec4(pos.x + bend, pos.y, h, 1.0);
  vW = w; vH = h; vDist = length(mv.xyz); vAhead = d;
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform float uBeat, uMid, uTilt, uSurge; uniform vec3 uFog; uniform vec4 uWaves;
varying vec2 vW; varying float vDist; varying float vH; varying float vAhead;
float line(float c){ float f = fwidth(c); return 1.0 - min(abs(fract(c-.5)-.5)/max(f,1e-4)*.8, 1.0); }
float wave(float age){ float x = (vAhead - 4.0 - age*${WAVE_SPEED.toFixed(1)}) / (2.0 + age*3.0); return exp(-x*x) * exp(-age*1.4); }
void main(){
  float ax = abs(vW.x);
  float wv = wave(uWaves.x) + wave(uWaves.y) + wave(uWaves.z) + wave(uWaves.w);
  vec3 magenta = mix(vec3(1.0,.1,.65), vec3(.6,.2,1.0), uTilt*.5), cyan = vec3(.1,.9,1.0), orange = vec3(1.0,.5,.1);
  vec3 col;
  if (ax < 3.0) {
    col = vec3(.02,.01,.05);
    float dash = step(fract(vW.y/6.0), .5) * (1.0 - smoothstep(.05,.12,ax));
    col += vec3(1.0,.85,.5) * dash * .9;
    col += cyan * smoothstep(.12,.0,abs(ax-2.85)) * (1.2 + wv*.8);
    col += magenta * line(vW.y*.25) * .25;
    col += magenta * wv * .35; // the wave sweeps across the asphalt too
  } else {
    float g = max(line(vW.x*.5), line(vW.y*.5));
    float far = smoothstep(20.0, 120.0, vDist);
    vec3 lc = mix(magenta, orange, clamp(vH/9.0,0.,1.)*.6 + uMid*.3);
    lc = mix(lc, cyan, smoothstep(30.0, 4.0, ax) * (.4 + uTilt*.25));
    lc = mix(lc, vec3(1.0,.75,.95), clamp(wv, 0.0, 1.0) * .3);
    col = vec3(.03,.008,.06) + lc * g * (1.0 + uBeat*.35 + wv*1.1 + uSurge*.1) * (1.0 - far*.3);
  }
  float f = smoothstep(40.0, 230.0, vDist);
  gl_FragColor = vec4(pow(mix(col, uFog, f), vec3(2.2)), 1.0);
}`;

export function createTerrain() {
  const geo = new PlaneGeometry(360, 300, 300, 300); // wide enough that bends never expose an edge before the fog
  const mat = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTravel: { value: 0 }, uBeat: { value: 0 }, uMid: { value: 0 }, uBass: { value: 0 }, uRough: { value: 0 }, uTilt: { value: 0 },
      uSurge: { value: 0 }, uBend: { value: 0 }, uFog: { value: FOG }, uWaves: { value: new Vector4(WAVE_IDLE, WAVE_IDLE, WAVE_IDLE, WAVE_IDLE) },
    },
  });
  const mesh = new Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2; // object z (height) -> world y; object y -> world -z
  mesh.position.z = -120;
  mesh.frustumCulled = false;
  return mesh;
}
