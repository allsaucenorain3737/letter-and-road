export const MAP = {
  west: 8.15,
  east: 38.45,
  south: 29.55,
  north: 44.45,
  latMid: 37.15,
  width: 1400,
  height: 862,
} as const

const COS = Math.cos((MAP.latMid * Math.PI) / 180)
const X_SPAN = (MAP.east - MAP.west) * COS
const Y_SPAN = MAP.north - MAP.south

export function project(lon: number, lat: number): { x: number; y: number } {
  const x = ((lon - MAP.west) * COS * MAP.width) / X_SPAN
  const y = ((MAP.north - lat) * MAP.height) / Y_SPAN
  return { x, y }
}

export function ringToPath(ring: [number, number][]): string {
  return ring
    .map((pt, i) => {
      const { x, y } = project(pt[0], pt[1])
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ') + ' Z'
}

export function polyToPath(poly: { outer: [number, number][]; holes: [number, number][][] }): string {
  return [poly.outer, ...poly.holes].map((ring) => ringToPath(ring)).join(' ')
}

export function lineToPath(points: [number, number][]): string {
  return points
    .map((pt, i) => {
      const { x, y } = project(pt[0], pt[1])
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function arcControl(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bulge: number,
): { cx: number; cy: number } {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  return { cx: mx + nx * bulge, cy: my + ny * bulge }
}

export function quadraticPoint(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number,
): { x: number; y: number } {
  const u = 1 - t
  return {
    x: u * u * x1 + 2 * u * t * cx + t * t * x2,
    y: u * u * y1 + 2 * u * t * cy + t * t * y2,
  }
}

export function arrowHead(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  size = 9,
): string {
  const p = quadraticPoint(x1, y1, cx, cy, x2, y2, 0.86)
  const tip = quadraticPoint(x1, y1, cx, cy, x2, y2, 0.97)
  const dx = tip.x - p.x
  const dy = tip.y - p.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const bx = tip.x - ux * size
  const by = tip.y - uy * size
  return `M ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L ${(bx + px * size * 0.55).toFixed(1)} ${(by + py * size * 0.55).toFixed(1)} L ${(bx - px * size * 0.55).toFixed(1)} ${(by - py * size * 0.55).toFixed(1)} Z`
}
