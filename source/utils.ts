export function randomVelocity(): number {
  const speedMultiplier = 1 / 750;
  return speedMultiplier * (Math.random() * 2 - 1);
}
