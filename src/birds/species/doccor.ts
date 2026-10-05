import type { SpeciesSpec } from '../spec'

// The Double-crested Cormorant, made in Blender (scripts/blender/doccor/, built by `blender -b --factory-startup -P
// scripts/blender/doccor/build.py` into public/models/doccor/). Its numbers and marks are from
// docs/research/2026-10-04-double-crested-cormorant.md: section 9 the model's, 7 the behaviour's (the `cormorant` style,
// src/behavior/cormorant.ts), 4 the marks. Two versions on one mesh: the adult (the default) and the bird of the year.
// The block fields below are the block bird's, which no one sees: the schema asks them of every species.

export const SPEC: SpeciesSpec = {
  code: 'doccor',
  commonName: 'Double-crested Cormorant',
  length: 0.6,
  body: { length: 1, height: 0.35, width: 0.32 },
  neck: { length: 0.45, thickness: 0.14, angle: 75 },
  head: { size: 0.22 },
  bill: { length: 0.16, thickness: 0.05, shape: 'hooked' },
  legs: { length: 0.18, thickness: 0.03 },
  tail: { length: 0.28, angle: 0 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.8,
  plumage: {
    crown: '#1d1b1a', cheek: '#1d1b1a', throat: '#e0a020', breast: '#1d1b1a', flank: '#1d1b1a',
    back: '#5a5450', wing: '#4a4540', speculum: null, rump: '#1d1b1a', tail: '#1c1b1a',
    bill: '#3a3530', legs: '#1a1a1a', eye: '#3a9a88',
  },
  variants: {
    adult: {},
    juvenile: { crown: '#6e6250', cheek: '#6e6250', throat: '#e3c8ab', breast: '#d2b796', flank: '#3a362d', back: '#8f8070', wing: '#7a6d60', bill: '#d8c4a0', eye: '#5f8f7a' },
  },
  marks: {
    size: 'a long dark waterbird, between a duck and a goose in size, riding so low that often only its neck and a streak of back show',
    bill: 'a thin, hooked bill about as long as the head, held tilted up on the water',
    head: 'a small head on a thick, kinked neck; bare orange-yellow skin on the face and throat, and a turquoise eye; no crests in autumn',
    body: 'black, with a scaled bronze-brown back (the adult); or brown, with a pale buff throat and breast and a dark belly (the bird of the year). It dives from the surface and stays down twenty seconds or more; it dries its wings spread on a perch',
    legs: 'short black legs set far back; on a stump it stands upright, propped on its stiff tail',
  },
  wingbeatHz: 5.2,
  foraging: 'cormorant',
  authored: {
    model: 'doccor',
    versions: ['adult', 'juvenile'],
    measurements: {
      length: 0.6, culmen: 0.057, billDepth: 0.017, billWidth: 0.012,
      tarsus: 0.065, tibia: 0.01, toe: 0.086, wingChord: 0.315, tail: 0.165,
    },
    // seven labels: neck, neckMid, neck3-neck6, and the head (scripts/blender/doccor/rig.py); each shape a bend per joint,
    // degrees from the modelled swim posture: hunch the tight resting S, erect the alert neck, strike the dive's reach.
    // Perched, the body stands 40 degrees up, so both bend the neck forward at its base. The modelled neck is the
    // swimmer's, drawn down into its feathers (0.11 m); erect it stretches to twice that, the research's 0.20 m along
    // the hindneck, and the crown stands 565 mm above the perch (the research's 0.57 m); drawn in, 422 (0.42)
    neck: 7,
    neckShapes: {
      hunch: [-60, 40, 40, 30, -20, -30, -10],
      erect: [-40, 0, 0, 0, 0, 0, 25],
      strike: [-60, -10, 0, 0, 10, 10, -20],
    },
    neckStretch: 2,
    amphibious: true,
    // a beat of continuous flapping (5.2 Hz, research 7.4), its shapes as the pelican's; drying: the wrists raised, the
    // hands hanging, about three-quarters open (research 7.2)
    flight: {
      beat: { shoulder: 30, lift: 5, hand: 20, lag: 0.12 },
      glide: { shoulder: 2, hand: -4 },
      dry: { shoulder: 45, sweep: 20, hand: -50, handSweep: 70 },
    },
    sources: [
      'Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 2 pp. 144-153; Ridgway 1887; Dawson 1923 (culmen, wing, tail, tarsus, toes; the bare skin; plumages)',
      'Tobias et al. 2022, AVONET (bill depth and width at the nostril, tarsus, wing, tail)',
      'swimming from iNaturalist 315924127 (c) Ilya Burylov, CC BY-NC, and 186642471, Sean Haight, CC0',
      'perched from iNaturalist 402520094 (c) Steve Foss, CC BY-NC, and 62049138 (c) Andy Frank, CC BY-NC',
      'the spread wing from Wikimedia Commons File:Double-Crested Cormorant at Travis AFB, California 170113-F-RU983-0020.jpg, Heide Couch, U.S. Air Force, public domain; and iNaturalist 95918337 (c) Patricia, CC BY-NC',
      'the head from Wikimedia Commons File:Double-crested Cormorant Head Close-Up 01.jpg, Amaury Laporte, CC BY 2.0',
      'the juvenile from iNaturalist 403970912 (c) vkjohn, CC BY-NC',
      'numbers and marks: docs/research/2026-10-04-double-crested-cormorant.md',
    ],
  },
}
