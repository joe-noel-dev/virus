export interface Zone {
  xPosition: number;
  yPosition: number;

  width: number;
  height: number;
}

export function generateZone(size: number): Zone {
  return {
    xPosition: Math.random() * (1 - size),
    yPosition: Math.random() * (1 - size),

    width: size,
    height: size,
  };
}
