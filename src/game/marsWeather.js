// A game-scale wind field. Direction and strength are illustrative, not live MEDA data.
export function windAt(time) {
  const angle = -2.38 + Math.sin(time / 85) * 0.32
  const strength = Math.max(0.15, Math.min(1, 0.46 + Math.sin(time / 17) * 0.2 + Math.sin(time / 5.7) * 0.13))
  const cycle = time % 92
  return { x: Math.cos(angle), y: Math.sin(angle), strength, dustDevil: cycle > 70 && cycle < 80, phase: (cycle - 70) / 10 }
}
