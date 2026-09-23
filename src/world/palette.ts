import type { Location } from '../location/schema'

export interface ScenePalette {
  skyTop: string
  skyHorizon: string
  sun: string
  fog: string
  ambientSky: string
  ambientGround: string
  /** degrees above the horizon */
  sunElevation: number
  /** compass degrees, 0 = -z, 90 = +x */
  sunAzimuth: number
}

const TIME: Record<Location['timeOfDay'], Pick<ScenePalette, 'sunElevation' | 'sunAzimuth' | 'sun' | 'skyTop' | 'skyHorizon'>> = {
  dawn:    { sunElevation: 6,  sunAzimuth: 100, sun: '#ffb27a', skyTop: '#5d7fb3', skyHorizon: '#f3c9a1' },
  morning: { sunElevation: 24, sunAzimuth: 120, sun: '#ffe2b8', skyTop: '#6f9fd8', skyHorizon: '#dce9f2' },
  midday:  { sunElevation: 58, sunAzimuth: 180, sun: '#fff6e8', skyTop: '#4f8fe0', skyHorizon: '#cfe3f5' },
  evening: { sunElevation: 9,  sunAzimuth: 255, sun: '#ffa15e', skyTop: '#4d6a9e', skyHorizon: '#f7c08a' },
}

const SEASON: Record<Location['season'], Pick<ScenePalette, 'fog' | 'ambientSky' | 'ambientGround'>> = {
  spring:         { fog: '#d6e4ea', ambientSky: '#bcd4e8', ambientGround: '#5e6b4a' },
  summer:         { fog: '#dbe6e4', ambientSky: '#c4dcf0', ambientGround: '#6a6f45' },
  'early-autumn': { fog: '#d9dfd6', ambientSky: '#bfd2e2', ambientGround: '#6f6540' },
  autumn:         { fog: '#d3d3cc', ambientSky: '#b6c6d6', ambientGround: '#6a5a3a' },
  winter:         { fog: '#cfd6dc', ambientSky: '#aebfd0', ambientGround: '#55585a' },
}

export function paletteFor(season: Location['season'], timeOfDay: Location['timeOfDay']): ScenePalette {
  return { ...TIME[timeOfDay], ...SEASON[season] }
}
