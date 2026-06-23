export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalize(value: number, min: number, max: number): number {
  if (Math.abs(max - min) < 0.0001) {
    return 0;
  }

  return clamp((value - min) / (max - min), 0, 1);
}

export function applyDeadZone(value: number, threshold: number): number {
  return value < threshold ? 0 : value;
}

export function smoothNumber(current: number, target: number, amount: number): number {
  return current + (target - current) * clamp(amount, 0, 1);
}

export function smoothAngle(current: number, target: number, amount: number): number {
  return smoothNumber(current, target, amount);
}
