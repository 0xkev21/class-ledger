import { cubicBezier, Easing } from 'react-native-reanimated';

/**
 * Strong ease-out for UI transitions (entering/exiting)
 */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * On-screen movement / morphing
 */
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/**
 * Standard iOS sheet curve
 */
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * Reanimated CSS transition timing function
 */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/**
 * Momentum projection: decides where a flick was going.
 * Apple's exponential-decay form — not the v²/2a from physics class.
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Rubber-banding: makes a boundary resist smoothly instead of stopping dead.
 * The further past the edge, the less the element follows.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
