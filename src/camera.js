// Apply button movement to the actual camera distance after any drag or wheel input.
export function nextCameraDistance(currentDistance, steps) {
  return Math.max(4.8, Math.min(12, currentDistance - steps * 0.7))
}
