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

export function unproject(x: number, y: number): { lon: number; lat: number } {
  const lon = MAP.west + (x * X_SPAN) / (MAP.width * COS)
  const lat = MAP.north - (y * Y_SPAN) / MAP.height
  return { lon, lat }
}

/** Convert SVG-space pixel offset near a lon/lat into a geographic delta. */
export function offsetToLonLat(
  lon: number,
  lat: number,
  dxPx: number,
  dyPx: number,
): [number, number] {
  const p = project(lon, lat)
  const g = unproject(p.x + dxPx, p.y + dyPx)
  return [g.lon, g.lat]
}

/**
 * Sample a quadratic letter arc in the same projected space as the SVG atlas,
 * then unproject to lon/lat LineString coordinates for MapLibre.
 */
export function sampleLetterArc(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
  bulge: number,
  steps = 32,
): [number, number][] {
  const a = project(lon1, lat1)
  const b = project(lon2, lat2)
  const c = arcControl(a.x, a.y, b.x, b.y, bulge)
  const coords: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const pt = quadraticPoint(a.x, a.y, c.cx, c.cy, b.x, b.y, t)
    const g = unproject(pt.x, pt.y)
    coords.push([g.lon, g.lat])
  }
  return coords
}

/** Tip bearing (degrees clockwise from north) near the end of a quadratic arc. */
export function arcTipBearing(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
  bulge: number,
): number {
  const a = project(lon1, lat1)
  const b = project(lon2, lat2)
  const c = arcControl(a.x, a.y, b.x, b.y, bulge)
  const p = quadraticPoint(a.x, a.y, c.cx, c.cy, b.x, b.y, 0.86)
  const tip = quadraticPoint(a.x, a.y, c.cx, c.cy, b.x, b.y, 0.97)
  const dx = tip.x - p.x
  const dy = tip.y - p.y
  // SVG y grows downward; MapLibre bearing is clockwise from north.
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI
  return ((deg % 360) + 360) % 360
}

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [MAP.west, MAP.south],
  [MAP.east, MAP.north],
]
