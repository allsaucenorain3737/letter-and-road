/**
 * Clip Natural Earth 50m land (public domain) to the eastern Mediterranean
 * and emit compact rings for the atlas.
 */
import fs from 'node:fs'
import path from 'node:path'

const WEST = 7.7
const EAST = 38.9
const SOUTH = 29.25
const NORTH = 44.75
const MIN_AREA = 0.0004

const src = path.resolve('tmp/ne_50m_land.geojson')
const dest = path.resolve('src/data/land-rings.json')

const geo = JSON.parse(fs.readFileSync(src, 'utf8'))
const features = geo.features ?? []

function ringBBox(ring) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

function bboxesOverlap(a) {
  return a.minX <= EAST && a.maxX >= WEST && a.minY <= NORTH && a.maxY >= SOUTH
}

function inside(p, edge) {
  const [x, y] = p
  switch (edge) {
    case 'left':
      return x >= WEST
    case 'right':
      return x <= EAST
    case 'bottom':
      return y >= SOUTH
    case 'top':
      return y <= NORTH
  }
}

function intersect(p, q, edge) {
  const [x1, y1] = p
  const [x2, y2] = q
  const dx = x2 - x1
  const dy = y2 - y1
  switch (edge) {
    case 'left': {
      const t = (WEST - x1) / (dx || 1e-12)
      return [WEST, y1 + t * dy]
    }
    case 'right': {
      const t = (EAST - x1) / (dx || 1e-12)
      return [EAST, y1 + t * dy]
    }
    case 'bottom': {
      const t = (SOUTH - y1) / (dy || 1e-12)
      return [x1 + t * dx, SOUTH]
    }
    case 'top': {
      const t = (NORTH - y1) / (dy || 1e-12)
      return [x1 + t * dx, NORTH]
    }
  }
}

function clipRing(ring) {
  let output = ring.map((p) => [p[0], p[1]])
  if (output.length > 1) {
    const a = output[0]
    const b = output[output.length - 1]
    if (a[0] !== b[0] || a[1] !== b[1]) output.push([a[0], a[1]])
  }
  for (const edge of ['left', 'right', 'bottom', 'top']) {
    if (output.length < 3) return []
    const input = output
    output = []
    for (let i = 0; i < input.length - 1; i++) {
      const cur = input[i]
      const next = input[i + 1]
      const curIn = inside(cur, edge)
      const nextIn = inside(next, edge)
      if (nextIn) {
        if (!curIn) output.push(intersect(cur, next, edge))
        output.push(next)
      } else if (curIn) {
        output.push(intersect(cur, next, edge))
      }
    }
    if (output.length) output.push(output[0])
  }
  if (output.length < 4) return []
  const cleaned = []
  for (const p of output) {
    const prev = cleaned[cleaned.length - 1]
    if (!prev || Math.abs(prev[0] - p[0]) > 1e-6 || Math.abs(prev[1] - p[1]) > 1e-6) {
      cleaned.push([Number(p[0].toFixed(4)), Number(p[1].toFixed(4))])
    }
  }
  if (cleaned.length > 1) {
    const a = cleaned[0]
    const b = cleaned[cleaned.length - 1]
    if (a[0] !== b[0] || a[1] !== b[1]) cleaned.push([a[0], a[1]])
  }
  return cleaned.length >= 4 ? cleaned : []
}

function ringArea(ring) {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(a / 2)
}

function polygonsOf(geom) {
  if (geom.type === 'Polygon') return [geom.coordinates]
  if (geom.type === 'MultiPolygon') return geom.coordinates
  return []
}

const land = []
for (const feature of features) {
  for (const poly of polygonsOf(feature.geometry)) {
    const outer = poly[0]
    if (!outer || !bboxesOverlap(ringBBox(outer))) continue
    const clippedOuter = clipRing(outer)
    if (!clippedOuter.length || ringArea(clippedOuter) < MIN_AREA) continue
    const holes = []
    for (const hole of poly.slice(1)) {
      const clipped = clipRing(hole)
      if (clipped.length && ringArea(clipped) >= MIN_AREA / 4) holes.push(clipped)
    }
    land.push({ outer: clippedOuter, holes })
  }
}

land.sort((a, b) => ringArea(b.outer) - ringArea(a.outer))

const payload = {
  source: 'Natural Earth 50m land (public domain)',
  attribution: 'Natural Earth, naturalearthdata.com',
  bbox: [WEST, SOUTH, EAST, NORTH],
  land,
}

fs.writeFileSync(dest, JSON.stringify(payload))
const kb = (fs.statSync(dest).size / 1024).toFixed(1)
console.log(`wrote ${dest} (${kb} KB, ${land.length} polygons)`)
