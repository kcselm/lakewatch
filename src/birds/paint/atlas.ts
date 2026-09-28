import type { Part } from '../detail/spec'

/**
 * 512 texels puts about 0.5 mm of a yellowlegs' skin in each texel, as fine as the telescope shows it at 22 m
 * (about 400 screen pixels along the bird); a larger atlas costs paint time and memory for detail nobody sees.
 */
export const ATLAS_SIZE = 512
/** texels of edge-replicated padding inside every region, so mipmaps never bleed a neighbour's colour */
export const PAD = 3

export interface Rect { x: number; y: number; w: number; h: number }

/** Pixel rectangles; y counts rows from the bottom of the texture (DataTexture row 0 is v = 0). */
export const REGIONS: Record<Part, Rect> = {
  skin:       { x: 0,   y: 0,   w: 512, h: 256 },
  wingFold:   { x: 0,   y: 256, w: 256, h: 128 },
  wingSpread: { x: 256, y: 256, w: 256, h: 64 },
  wingUnder:  { x: 256, y: 320, w: 256, h: 64 },
  tail:       { x: 0,   y: 384, w: 128, h: 64 },
  tailUnder:  { x: 128, y: 384, w: 128, h: 64 },
  bill:       { x: 256, y: 384, w: 128, h: 32 },
  legs:       { x: 384, y: 384, w: 32,  h: 32 },
  eye:        { x: 416, y: 384, w: 32,  h: 32 },
  // free space until now, so no shipped bird's atlas moves
  shield:     { x: 448, y: 384, w: 64,  h: 32 },
  curl:       { x: 256, y: 416, w: 64,  h: 32 },
  plume:      { x: 320, y: 416, w: 64,  h: 32 },
}

/** Texture coordinates for part-local (s, t), both 0..1: s runs along the region's width, t up its height. */
export function atlasUV(part: Part, s: number, t: number): [number, number] {
  const r = REGIONS[part]
  const px = r.x + PAD + Math.min(Math.max(s, 0), 1) * (r.w - 2 * PAD)
  const py = r.y + PAD + Math.min(Math.max(t, 0), 1) * (r.h - 2 * PAD)
  return [px / ATLAS_SIZE, py / ATLAS_SIZE]
}

/** Part-local (s, t) of a pixel centre inside a region, clamped to 0..1 so the padding repeats the edge. */
export function pixelST(part: Part, px: number, py: number): [number, number] {
  const r = REGIONS[part]
  const s = (px + 0.5 - r.x - PAD) / (r.w - 2 * PAD)
  const t = (py + 0.5 - r.y - PAD) / (r.h - 2 * PAD)
  return [Math.min(Math.max(s, 0), 1), Math.min(Math.max(t, 0), 1)]
}
