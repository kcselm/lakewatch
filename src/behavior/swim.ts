import type { BehaviorContext, BehaviorController } from './types'
import { createDabbler, dabblerFor } from './dabbler'
import { createShoveler, SHOVELER } from './shoveler'
import { createCoot, COOT } from './coot'
import { createGrebe, GREBE } from './grebe'
import { createGoose, gooseFor } from './goose'
import { createPelican, PELICAN } from './pelican'
import { createCormorant, CORMORANT } from './cormorant'
import type { Company } from './swimmer'
import type { Foraging } from '../birds/spec'

/**
 * Swim in the species' style. No style, or a probing one (validateCast rejects that), swims as a dabbler, with the
 * species' own dabbler settings if it has them.
 */
export function createSwim(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  switch (ctx.foraging) {
    case 'shoveler': return createShoveler(ctx, startX, startZ)
    case 'coot': return createCoot(ctx, startX, startZ)
    case 'grebe': return createGrebe(ctx, startX, startZ)
    case 'goose': return createGoose(ctx, startX, startZ)
    case 'pelican': return createPelican(ctx, startX, startZ)
    case 'cormorant': return createCormorant(ctx, startX, startZ)
    default: return createDabbler(ctx, startX, startZ, dabblerFor(ctx.species))
  }
}

/** How a swimmer of this style and species keeps company, for the spawner to start it among its flock. */
export function companyOf(foraging?: Foraging, species?: string): Company {
  const S = foraging === 'shoveler' ? SHOVELER : foraging === 'coot' ? COOT : foraging === 'grebe' ? GREBE : foraging === 'goose' ? gooseFor(species) : foraging === 'pelican' ? PELICAN : foraging === 'cormorant' ? CORMORANT : dabblerFor(species)
  return { radius: S.flock.radius, retargetSeconds: S.flock.retargetSeconds, spacing: S.spacing, apart: S.flock.apart }
}
