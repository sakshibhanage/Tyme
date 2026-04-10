/**
 * Shared 3D envelope framing for the home hero and seal-style canvases.
 * Keep in sync with `SealEnvelopePocketFront` tuning.
 */
export const SEAL_ENVELOPE_SCALE = 1.63
export const SEAL_ENVELOPE_CAMERA: [number, number, number] = [0, -0.1, 6.96]
export const SEAL_ENVELOPE_STATIC_Y = -0.71

/**
 * Applied only when the flap is fully closed **and** not in a flap animation, so the closed silhouette
 * matches the open pose on screen. During open/close runs, scale stays at `SEAL_ENVELOPE_SCALE` so only
 * the flap moves (no breathing). Tune if closed vs open still feel mismatched.
 */
export const ENVELOPE_CLOSED_REST_SCALE_MULTIPLIER = 1.13

/** Framing for the clay envelope (flap open or closed). */
export const SEAL_ENVELOPE_VIEW_EDITING = {
  envelopeScale: SEAL_ENVELOPE_SCALE,
  cameraPosition: SEAL_ENVELOPE_CAMERA,
  staticRootY: SEAL_ENVELOPE_STATIC_Y,
} as const
