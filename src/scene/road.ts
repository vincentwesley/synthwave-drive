// Winding road centreline X(s), s = distance along the road. Shared by the terrain shader (GLSL) and the camera (TS) so they agree.
export const BEND = { amp: 22, k1: 0.0105, k2: 0.0231 } as const;

export const ROAD_GLSL = /* glsl */ `
float roadX(float s, float a){ return a * (sin(s*${BEND.k1}) + .45*sin(s*${BEND.k2}+1.3)); }
float roadDX(float s, float a){ return a * (${BEND.k1}*cos(s*${BEND.k1}) + .45*${BEND.k2}*cos(s*${BEND.k2}+1.3)); }`;

/** Slope of the road at s (dX/ds). */
export const roadSlope = (s: number, a: number) =>
  a * (BEND.k1 * Math.cos(s * BEND.k1) + 0.45 * BEND.k2 * Math.cos(s * BEND.k2 + 1.3));

/** Curvature of the road at s (d2X/ds2). */
export const roadCurve = (s: number, a: number) =>
  -a * (BEND.k1 ** 2 * Math.sin(s * BEND.k1) + 0.45 * BEND.k2 ** 2 * Math.sin(s * BEND.k2 + 1.3));
