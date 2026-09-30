/**
 * Lightweight Roman-road graph + shortest paths for story travel animation.
 * Built once from public/geo/roman-roads.geojson; paths cached by city pair.
 */

import { CITY_BY_ID } from '../data/cities'
import { STORY } from '../data/story'

export type LonLat = [number, number]

type NodeKey = string

const SNAP_KM = 50
const BRIDGE_KM = 15
const NODE_CELL = 0.25
const END_CELL = 0.15

let ready: Promise<void> | null = null
let nodes = new Map<NodeKey, LonLat>()
let adj = new Map<NodeKey, { to: NodeKey; w: number }[]>()
let snapGrid = new Map<string, NodeKey[]>()
const pathCache = new Map<string, LonLat[] | null>()

function nk(lon: number, lat: number): NodeKey {
  return `${lon.toFixed(4)},${lat.toFixed(4)}`
}

function hav(a: LonLat, b: LonLat): number {
  const R = 6371
  const toRad = Math.PI / 180
  const p1 = a[1] * toRad
  const p2 = b[1] * toRad
  const dphi = (b[1] - a[1]) * toRad
  const dl = (b[0] - a[0]) * toRad
  const x =
    Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)))
}

function cellKey(lon: number, lat: number, cell: number): string {
  return `${Math.floor(lon / cell)}:${Math.floor(lat / cell)}`
}

function addEdge(a: NodeKey, b: NodeKey, w: number) {
  if (a === b) return
  let la = adj.get(a)
  if (!la) {
    la = []
    adj.set(a, la)
  }
  la.push({ to: b, w })
  let lb = adj.get(b)
  if (!lb) {
    lb = []
    adj.set(b, lb)
  }
  lb.push({ to: a, w })
}

function buildFromGeoJSON(fc: {
  features: {
    geometry: { type: string; coordinates: number[][][] | number[][][][] }
  }[]
}) {
  nodes = new Map()
  adj = new Map()
  const endpoints = new Set<NodeKey>()

  for (const f of fc.features) {
    const g = f.geometry
    if (!g) continue
    const lines: number[][][] =
      g.type === 'MultiLineString'
        ? (g.coordinates as number[][][])
        : g.type === 'LineString'
          ? [g.coordinates as unknown as number[][]]
          : []
    for (const line of lines) {
      if (!line || line.length < 2) continue
      const keys: NodeKey[] = []
      for (const pt of line) {
        const lon = pt[0]
        const lat = pt[1]
        const k = nk(lon, lat)
        if (!nodes.has(k)) nodes.set(k, [lon, lat])
        keys.push(k)
      }
      endpoints.add(keys[0])
      endpoints.add(keys[keys.length - 1])
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i]
        const b = keys[i + 1]
        addEdge(a, b, hav(nodes.get(a)!, nodes.get(b)!))
      }
    }
  }

  // Bridge nearby road endpoints so AWMC gaps don't strand long routes.
  const endGrid = new Map<string, NodeKey[]>()
  for (const k of endpoints) {
    const [lon, lat] = nodes.get(k)!
    const ck = cellKey(lon, lat, END_CELL)
    const bucket = endGrid.get(ck)
    if (bucket) bucket.push(k)
    else endGrid.set(ck, [k])
  }
  for (const k of endpoints) {
    const [lon, lat] = nodes.get(k)!
    const cx = Math.floor(lon / END_CELL)
    const cy = Math.floor(lat / END_CELL)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = endGrid.get(`${cx + dx}:${cy + dy}`)
        if (!bucket) continue
        for (const k2 of bucket) {
          if (k2 <= k) continue
          const d = hav(nodes.get(k)!, nodes.get(k2)!)
          if (d > 0.05 && d <= BRIDGE_KM) addEdge(k, k2, d * 1.08)
        }
      }
    }
  }

  snapGrid = new Map()
  for (const [k, pt] of nodes) {
    const ck = cellKey(pt[0], pt[1], NODE_CELL)
    const bucket = snapGrid.get(ck)
    if (bucket) bucket.push(k)
    else snapGrid.set(ck, [k])
  }
}

function snap(lon: number, lat: number): NodeKey | null {
  let best: NodeKey | null = null
  let bestD = Infinity
  const cx = Math.floor(lon / NODE_CELL)
  const cy = Math.floor(lat / NODE_CELL)
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const bucket = snapGrid.get(`${cx + dx}:${cy + dy}`)
      if (!bucket) continue
      for (const k of bucket) {
        const d = hav([lon, lat], nodes.get(k)!)
        if (d < bestD) {
          bestD = d
          best = k
        }
      }
    }
  }
  return best !== null && bestD <= SNAP_KM ? best : null
}

function dijkstra(a: NodeKey, b: NodeKey): NodeKey[] | null {
  if (a === b) return [a]
  const dist = new Map<NodeKey, number>([[a, 0]])
  const prev = new Map<NodeKey, NodeKey>()
  const heap: { d: number; u: NodeKey }[] = [{ d: 0, u: a }]

  const push = (item: { d: number; u: NodeKey }) => {
    heap.push(item)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p].d <= heap[i].d) break
      const t = heap[p]
      heap[p] = heap[i]
      heap[i] = t
      i = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()!
    if (heap.length) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let s = i
        if (l < heap.length && heap[l].d < heap[s].d) s = l
        if (r < heap.length && heap[r].d < heap[s].d) s = r
        if (s === i) break
        const t = heap[i]
        heap[i] = heap[s]
        heap[s] = t
        i = s
      }
    }
    return top
  }

  while (heap.length) {
    const { d, u } = pop()
    if (u === b) break
    if (d > (dist.get(u) ?? Infinity)) continue
    const nbrs = adj.get(u)
    if (!nbrs) continue
    for (const { to, w } of nbrs) {
      const nd = d + w
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd)
        prev.set(to, u)
        push({ d: nd, u: to })
      }
    }
  }
  if (!prev.has(b) && a !== b) return null
  const path: NodeKey[] = [b]
  while (path[path.length - 1] !== a) {
    const p = prev.get(path[path.length - 1])
    if (!p) return null
    path.push(p)
  }
  path.reverse()
  return path
}

/** Gentle land fallback when roads don't connect (e.g. Athens/Corinth gap). */
export function fallbackLandPath(a: LonLat, b: LonLat, steps = 24): LonLat[] {
  const coords: LonLat[] = []
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const bulge = Math.min(0.35, len * 0.08)
  const cx = mx - (dy / len) * bulge
  const cy = my + (dx / len) * bulge
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    coords.push([
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ])
  }
  return coords
}

export function seaArcPath(a: LonLat, b: LonLat, steps = 40): LonLat[] {
  const coords: LonLat[] = []
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const bulge = Math.min(1.2, Math.max(0.25, len * 0.18))
  const cx = mx - (dy / len) * bulge
  const cy = my + (dx / len) * bulge
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    coords.push([
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ])
  }
  return coords
}

function decimate(coords: LonLat[], minKm = 1.2): LonLat[] {
  if (coords.length <= 2) return coords
  const out: LonLat[] = [coords[0]]
  let last = coords[0]
  for (let i = 1; i < coords.length - 1; i++) {
    if (hav(last, coords[i]) >= minKm) {
      out.push(coords[i])
      last = coords[i]
    }
  }
  out.push(coords[coords.length - 1])
  return out
}

function pathBetweenCities(fromId: string, toId: string): LonLat[] {
  const cacheKey = `${fromId}>${toId}`
  if (pathCache.has(cacheKey)) return pathCache.get(cacheKey) ?? fallbackPair(fromId, toId)

  const from = CITY_BY_ID[fromId]
  const to = CITY_BY_ID[toId]
  if (!from || !to) {
    pathCache.set(cacheKey, null)
    return []
  }
  const a: LonLat = [from.lon, from.lat]
  const b: LonLat = [to.lon, to.lat]
  const sa = snap(from.lon, from.lat)
  const sb = snap(to.lon, to.lat)
  if (!sa || !sb) {
    const fb = decimate(fallbackLandPath(a, b))
    pathCache.set(cacheKey, fb)
    return fb
  }
  const keys = dijkstra(sa, sb)
  if (!keys || keys.length < 2) {
    const fb = decimate(fallbackLandPath(a, b))
    pathCache.set(cacheKey, fb)
    return fb
  }
  const road: LonLat[] = [a, ...keys.map((k) => nodes.get(k)!), b]
  const out = decimate(road)
  pathCache.set(cacheKey, out)
  return out
}

function fallbackPair(fromId: string, toId: string): LonLat[] {
  const from = CITY_BY_ID[fromId]
  const to = CITY_BY_ID[toId]
  if (!from || !to) return []
  return decimate(fallbackLandPath([from.lon, from.lat], [to.lon, to.lat]))
}

/** Concatenate road (or fallback) segments for a land travel event. */
export function landTravelCoordinates(waypoints: string[]): LonLat[] {
  const coords: LonLat[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const seg = pathBetweenCities(waypoints[i], waypoints[i + 1])
    if (!seg.length) continue
    if (coords.length) coords.push(...seg.slice(1))
    else coords.push(...seg)
  }
  return coords
}

export function seaTravelCoordinates(waypoints: string[]): LonLat[] {
  const coords: LonLat[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = CITY_BY_ID[waypoints[i]]
    const to = CITY_BY_ID[waypoints[i + 1]]
    if (!from || !to) continue
    const seg = seaArcPath([from.lon, from.lat], [to.lon, to.lat])
    if (coords.length) coords.push(...seg.slice(1))
    else coords.push(...seg)
  }
  return coords
}

export function ensureRoadGraph(): Promise<void> {
  if (ready) return ready
  ready = (async () => {
    const url = `${import.meta.env.BASE_URL}geo/roman-roads.geojson`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to load roman roads (${res.status})`)
    const fc = await res.json()
    buildFromGeoJSON(fc)
    // Warm cache for story land segments so Play is smooth.
    for (const ev of STORY) {
      if (ev.type !== 'travel' || ev.mode !== 'land') continue
      landTravelCoordinates(ev.waypoints)
    }
  })().catch((err) => {
    ready = null
    throw err
  })
  return ready
}

/** Truncate a LineString by fraction t ∈ [0,1], interpolating the last segment. */
export function truncateLine(coords: LonLat[], t: number): LonLat[] {
  if (coords.length < 2) return coords.slice()
  const clamped = Math.min(1, Math.max(0, t))
  if (clamped <= 0) return [coords[0]]
  if (clamped >= 1) return coords.slice()

  let total = 0
  const segLens: number[] = []
  for (let i = 0; i < coords.length - 1; i++) {
    const d = hav(coords[i], coords[i + 1])
    segLens.push(d)
    total += d
  }
  if (total <= 0) return [coords[0]]
  let target = total * clamped
  const out: LonLat[] = [coords[0]]
  for (let i = 0; i < segLens.length; i++) {
    const d = segLens[i]
    if (target >= d) {
      out.push(coords[i + 1])
      target -= d
    } else {
      const r = d > 0 ? target / d : 0
      const a = coords[i]
      const b = coords[i + 1]
      out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r])
      break
    }
  }
  return out
}

export function pointAlong(coords: LonLat[], t: number): LonLat | null {
  const line = truncateLine(coords, t)
  return line.length ? line[line.length - 1] : null
}
