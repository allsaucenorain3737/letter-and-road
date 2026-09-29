import { useEffect, useMemo, useRef } from 'react'
import {
  Map as MapLibreMap,
  getVersion,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { CITIES, CITY_BY_ID } from '../data/cities'
import { CITY_CONTEXT_BY_ID } from '../data/city-contexts'
import { IMPRISONMENTS } from '../data/journeys'
import { START_LABEL_IDS } from '../data/story'
import { useMediaQuery, useReducedMotion } from '../hooks'
import { MAP_BOUNDS, offsetToLonLat } from '../lib/geo'
import { useApp } from '../state/AppState'
import { MediterraneanMapSvg } from './MediterraneanMapSvg'

// MapLibre v6 worker is an ES module that imports a sibling shared chunk.
// Vite's worker pipeline injects /@vite/client into it in dev and breaks tiles.
// Load the exact installed version's worker from jsDelivr (cross-origin); MapLibre
// wraps that in a blob `import` so the CDN sibling shared.mjs resolves correctly.
const MAPLIBRE_WORKER_URL =
  `https://cdn.jsdelivr.net/npm/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs`
setWorkerUrl(MAPLIBRE_WORKER_URL)

/** Feature flag: set VITE_USE_MAPLIBRE=false to restore the SVG atlas. Default true. */
const USE_MAPLIBRE = import.meta.env.VITE_USE_MAPLIBRE !== 'false'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

const SRC = {
  roads: 'lr-roman-roads',
  prisons: 'lr-prisons',
  cities: 'lr-cities',
} as const

/** Liberty basemap layers to mute (modern admin / place / POI / road labels). */
const MUTE_OPACITY: Record<string, number> = {
  boundary_2: 0.22,
  boundary_3: 0.12,
  boundary_disputed: 0.18,
  label_country_1: 0.28,
  label_country_2: 0.28,
  label_country_3: 0.22,
  label_state: 0.2,
  label_city: 0.22,
  label_city_capital: 0.28,
  label_town: 0.14,
  label_village: 0.1,
  label_other: 0.12,
  water_name_point_label: 0.45,
  water_name_line_label: 0.4,
  waterway_line_label: 0.35,
}

const HIDE_LAYER_IDS = new Set([
  'poi_r1',
  'poi_r7',
  'poi_r20',
  'poi_transit',
  'highway-name-path',
  'highway-name-minor',
  'highway-name-major',
  'highway-shield-non-us',
  'highway-shield-us-interstate',
  'road_shield_us',
  'airport',
  'road_one_way_arrow',
  'road_one_way_arrow_opposite',
])

type LonLat = [number, number]

type FeatureProps = Record<string, string | number | boolean | null | undefined>

type Feature = {
  type: 'Feature'
  properties: FeatureProps
  geometry:
    | { type: 'Point'; coordinates: LonLat }
    | { type: 'LineString'; coordinates: LonLat[] }
}

type FC = {
  type: 'FeatureCollection'
  features: Feature[]
}

const EMPTY: FC = { type: 'FeatureCollection', features: [] }

export function MediterraneanMap() {
  if (!USE_MAPLIBRE) return <MediterraneanMapSvg />
  return <MediterraneanMapLibre />
}

function MediterraneanMapLibre() {
  const app = useApp()
  const compact = useMediaQuery('(max-width: 720px)')
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const readyRef = useRef(false)
  const pendingPushRef = useRef<(() => void) | null>(null)
  const appRef = useRef(app)
  appRef.current = app

  const showPrisons = app.phase === 'explore' && app.layers.imprisonments

  // --- Map init ---
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    setWorkerUrl(MAPLIBRE_WORKER_URL)
    const map = new MapLibreMap({
      container: el,
      style: STYLE_URL,
      center: [25, 37],
      zoom: 4,
      attributionControl: { compact: true },
      cooperativeGestures: false,
      fadeDuration: 0,
      minZoom: 3.5,
      maxZoom: 10,
      pixelRatio: 1,
      maxCanvasSize: [8192, 8192],
    })
    mapRef.current = map
    ;(window as unknown as { __lrMap?: MapLibreMap }).__lrMap = map

    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()

    const onLoad = () => {
      map.resize()
      map.fitBounds(MAP_BOUNDS, { padding: 24, animate: false })
      try {
        muteBasemap(map)
        addOverlayImages(map)
        ensureSources(map)
        ensureLayers(map)
      } catch (err) {
        console.error('[maplibre] overlay setup failed', err)
      }
      readyRef.current = true
      // Push overlay data now. Do not gate on isStyleLoaded(): adding the remote
      // roman-roads GeoJSON marks the style unloaded until that fetch finishes, which
      // would skip this push and leave lr-cities empty forever (roads still appear).
      pendingPushRef.current?.()
      map.once('idle', () => {
        pendingPushRef.current?.()
      })
    }
    map.on('load', onLoad)
    map.on('error', (e) => {
      console.error('[maplibre]', e.error || e)
    })
    requestAnimationFrame(() => {
      map.resize()
    })

    const onCityClick = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0]
      const id = f?.properties?.id as string | undefined
      if (id) appRef.current.setCity(id)
    }

    const setPointer = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const clearPointer = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', 'cities-circle', onCityClick)
    map.on('click', 'cities-diamond', onCityClick)
    map.on('mouseenter', 'cities-circle', setPointer)
    map.on('mouseleave', 'cities-circle', clearPointer)
    map.on('mouseenter', 'cities-diamond', setPointer)
    map.on('mouseleave', 'cities-diamond', clearPointer)

    const ro = new ResizeObserver(() => {
      map.resize()
    })
    ro.observe(el)

    return () => {
      readyRef.current = false
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // Intentionally once: map lifecycle. Click handlers close over stable app setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const prisonData = useMemo((): FC => {
    if (!showPrisons) return EMPTY
    return {
      type: 'FeatureCollection',
      features: IMPRISONMENTS.map((imp) => {
        const city = CITY_BY_ID[imp.cityId]
        if (!city) return null
        const coordinates = offsetToLonLat(city.lon, city.lat, imp.offset[0], imp.offset[1])
        return {
          type: 'Feature' as const,
          properties: { id: imp.id, label: `${imp.label} · ${imp.years}` },
          geometry: { type: 'Point' as const, coordinates },
        }
      }).filter((f): f is NonNullable<typeof f> => f !== null),
    }
  }, [showPrisons])

  const cityData = useMemo((): FC => {
    const cities = CITIES.filter((c) => {
      if (START_LABEL_IDS.has(c.id)) return true
      return c.letterRelevant || Boolean(CITY_CONTEXT_BY_ID[c.id])
    })

    return {
      type: 'FeatureCollection',
      features: cities
        .filter((city) => {
          const named = START_LABEL_IDS.has(city.id) || city.letterRelevant
          const selected = app.cityId === city.id
          if (compact && !named && !selected) return false
          return true
        })
        .map((city) => {
          const named = START_LABEL_IDS.has(city.id) || city.letterRelevant
          const selected = app.cityId === city.id
          return {
            type: 'Feature' as const,
            properties: {
              id: city.id,
              name: city.name,
              shortLabel: city.shortLabel,
              description: city.description,
              named: named ? 1 : 0,
              selected: selected ? 1 : 0,
              planted: city.planted ? 1 : 0,
              diamond: city.id === 'damascus_road' ? 1 : 0,
              radius: selected ? (named ? 8.5 : 7) : named ? 6.5 : 4,
            },
            geometry: { type: 'Point' as const, coordinates: [city.lon, city.lat] },
          }
        }),
    }
  }, [app.cityId, compact])

  useEffect(() => {
    const push = () => {
      const map = mapRef.current
      if (!map || !readyRef.current) return
      // Sources exist after onLoad ensureSources; isStyleLoaded may still be false
      // while roman-roads.geojson is fetching — setData is safe either way.
      if (!map.getSource(SRC.cities) || !map.getSource(SRC.prisons)) return
      setSourceData(map, SRC.prisons, prisonData)
      setSourceData(map, SRC.cities, cityData)
    }

    pendingPushRef.current = push
    push()
  }, [prisonData, cityData])

  function zoomIn() {
    mapRef.current?.zoomIn({ animate: !reduced })
  }
  function zoomOut() {
    mapRef.current?.zoomOut({ animate: !reduced })
  }
  function resetView() {
    mapRef.current?.fitBounds(MAP_BOUNDS, {
      padding: 24,
      animate: !reduced,
      duration: reduced ? 0 : 600,
    })
  }

  return (
    <div className="atlas">
      <div
        ref={wrapRef}
        className="map-wrap map-wrap--maplibre"
        role="img"
        aria-label="Eastern Mediterranean map of cities in the life and letters of Paul"
      />

      <aside className="legend-card" aria-label="Map legend">
        <div className="legend-row">
          <span className="swatch is-city" />
          Pauline place
        </div>
        <div className="legend-row">
          <span className="swatch is-planted" />
          Church Paul planted
        </div>
        <div className="legend-row">
          <span className="swatch is-road" />
          Roman road
        </div>
      </aside>

      <div className="map-controls">
        <button className="icon-btn" type="button" onClick={zoomIn} aria-label="Zoom in">
          +
        </button>
        <button className="icon-btn" type="button" onClick={zoomOut} aria-label="Zoom out">
          −
        </button>
        <button className="icon-btn" type="button" onClick={resetView} aria-label="Reset map view">
          ⌖
        </button>
      </div>
    </div>
  )
}

function setSourceData(map: MapLibreMap, id: string, data: FC) {
  const src = map.getSource(id) as GeoJSONSource | undefined
  if (src) src.setData(data as Parameters<GeoJSONSource['setData']>[0])
}

function muteBasemap(map: MapLibreMap) {
  const style = map.getStyle() as StyleSpecification | undefined
  const layers = style?.layers
  if (!layers) return

  for (const layer of layers) {
    const id = layer.id
    if (HIDE_LAYER_IDS.has(id)) {
      try {
        map.setLayoutProperty(id, 'visibility', 'none')
      } catch {
        /* layer may lack layout */
      }
      continue
    }

    const opacity = MUTE_OPACITY[id]
    if (opacity == null) continue

    try {
      if (layer.type === 'symbol') {
        map.setPaintProperty(id, 'text-opacity', opacity)
        map.setPaintProperty(id, 'icon-opacity', Math.min(opacity, 0.35))
        // Slightly smaller modern place names so our city labels win.
        if (id.startsWith('label_')) {
          const size = map.getLayoutProperty(id, 'text-size')
          if (typeof size === 'number') {
            map.setLayoutProperty(id, 'text-size', Math.max(9, size * 0.78))
          }
        }
      } else if (layer.type === 'line') {
        map.setPaintProperty(id, 'line-opacity', opacity)
        map.setPaintProperty(id, 'line-color', '#a8a29a')
      }
    } catch (err) {
      console.warn('[maplibre] mute failed for', id, err)
    }
  }

  // Keep OpenFreeMap Natural Earth shaded relief (topography) at mid weight.
  if (map.getLayer('natural_earth')) {
    try {
      map.setPaintProperty('natural_earth', 'raster-opacity', [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        0,
        0.55,
        6,
        0.22,
      ])
    } catch {
      /* ignore */
    }
  }
}

function ensureSources(map: MapLibreMap) {
  if (!map.getSource(SRC.roads)) {
    map.addSource(SRC.roads, {
      type: 'geojson',
      data: `${import.meta.env.BASE_URL}geo/roman-roads.geojson`,
      attribution:
        'Ancient World Mapping Center roads (ODbL 1.0); Barrington Atlas / OSM derived',
    })
  }
  for (const id of [SRC.prisons, SRC.cities]) {
    if (!map.getSource(id)) {
      map.addSource(id, { type: 'geojson', data: EMPTY })
    }
  }
}

function ensureLayers(map: MapLibreMap) {
  // AWMC / Barrington-derived Roman roads (clipped to atlas bbox) — mid weight.
  if (!map.getLayer('roman-roads-minor')) {
    map.addLayer({
      id: 'roman-roads-minor',
      type: 'line',
      source: SRC.roads,
      filter: ['!=', ['get', 'major'], 1],
      paint: {
        'line-color': '#9a8b78',
        'line-width': 0.9,
        'line-opacity': 0.42,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    })
  }
  if (!map.getLayer('roman-roads-major')) {
    map.addLayer({
      id: 'roman-roads-major',
      type: 'line',
      source: SRC.roads,
      filter: ['==', ['get', 'major'], 1],
      paint: {
        'line-color': '#7d6b58',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          3.5,
          1.2,
          7,
          2.0,
        ],
        'line-opacity': 0.58,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    })
  }

  if (!map.getLayer('prisons-square')) {
    map.addLayer({
      id: 'prisons-square',
      type: 'symbol',
      source: SRC.prisons,
      layout: {
        'icon-image': 'lr-prison',
        'icon-size': 0.7,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    })
  }

  if (!map.getLayer('cities-circle')) {
    map.addLayer({
      id: 'cities-circle',
      type: 'circle',
      source: SRC.cities,
      filter: ['!=', ['get', 'diamond'], 1],
      paint: {
        'circle-radius': ['get', 'radius'],
        'circle-color': [
          'case',
          ['==', ['get', 'planted'], 1],
          '#9a7b3c',
          '#f7f4ee',
        ],
        'circle-stroke-color': [
          'case',
          ['==', ['get', 'selected'], 1],
          '#e8c97a',
          '#1a2a33',
        ],
        'circle-stroke-width': [
          'case',
          ['==', ['get', 'selected'], 1],
          2.6,
          1.5,
        ],
        'circle-opacity': 1,
      },
    })
  }

  if (!map.getLayer('cities-diamond')) {
    map.addLayer({
      id: 'cities-diamond',
      type: 'symbol',
      source: SRC.cities,
      filter: ['==', ['get', 'diamond'], 1],
      layout: {
        'icon-image': 'lr-diamond',
        'icon-size': [
          'case',
          ['==', ['get', 'selected'], 1],
          0.9,
          0.75,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    })
  }

  // Forefront: Pauline atlas city labels — strongest text on the map.
  if (!map.getLayer('cities-label')) {
    map.addLayer({
      id: 'cities-label',
      type: 'symbol',
      source: SRC.cities,
      filter: [
        'any',
        ['==', ['get', 'named'], 1],
        ['==', ['get', 'selected'], 1],
      ],
      layout: {
        'text-field': ['get', 'shortLabel'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          3.5,
          13,
          6,
          15,
          9,
          17,
        ],
        'text-font': ['Noto Sans Bold'],
        'text-offset': [1.15, -0.75],
        'text-anchor': 'left',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'symbol-sort-key': 0,
      },
      paint: {
        'text-color': [
          'case',
          ['==', ['get', 'selected'], 1],
          '#fff8ee',
          '#14222c',
        ],
        'text-halo-color': [
          'case',
          ['==', ['get', 'selected'], 1],
          'rgba(36, 63, 92, 0.92)',
          'rgba(255, 248, 238, 0.95)',
        ],
        'text-halo-width': 2.2,
        'text-opacity': 1,
      },
    })
  }
}

function addOverlayImages(map: MapLibreMap) {
  if (!map.hasImage('lr-diamond')) {
    map.addImage('lr-diamond', drawDiamond(28), { pixelRatio: 2 })
  }
  if (!map.hasImage('lr-prison')) {
    map.addImage('lr-prison', drawPrison(22), { pixelRatio: 2 })
  }
}

function drawDiamond(size: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r * 0.78, cy)
  ctx.lineTo(cx, cy + r)
  ctx.lineTo(cx - r * 0.78, cy)
  ctx.closePath()
  ctx.fillStyle = '#243f5c'
  ctx.fill()
  ctx.strokeStyle = '#f7f4ee'
  ctx.lineWidth = 1.6
  ctx.stroke()
  return ctx.getImageData(0, 0, size, size)
}

function drawPrison(size: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const pad = 4
  ctx.strokeStyle = '#7a2e2e'
  ctx.lineWidth = 2
  ctx.strokeRect(pad, pad, size - pad * 2, size - pad * 2)
  return ctx.getImageData(0, 0, size, size)
}
