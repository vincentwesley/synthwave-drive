export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** World units per second. Idle (no audio) is a fixed cruise; energy adds up to +30. */
export const driveSpeed = (energy: number, reduced: boolean) => (20 + 30 * clamp01(energy)) * (reduced ? 0.4 : 1);

/** Frame-rate independent exponential approach of `cur` toward `target`. */
export const ease = (cur: number, target: number, dt: number, rate = 3) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
