import landData from './land-rings.json' with { type: 'json' }

export interface LandPoly {
  outer: [number, number][]
  holes: [number, number][][]
}

export const LAND: LandPoly[] = landData.land as unknown as LandPoly[]

export const LAND_ATTRIBUTION = landData.attribution as string

export const LAND_SOURCE = landData.source as string
