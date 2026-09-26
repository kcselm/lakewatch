import type { BehaviorContext, BehaviorController } from './types'
import { createDabbler, dabblerFor } from './dabbler'
import { createShoveler, SHOVELER } from './shoveler'
import type { Company } from './swimmer'
import type { Foraging } from '../birds/spec'

/**
 * Swim in the species' style. No style, or a probing one (validateCast rejects that), swims as a dabbler, with the
 * species' own dabbler settings if it has them. Until each style has its own state machine, it swims as a dabbler too.
 */
export function createSwim(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  switch (ctx.foraging) {
    case 'shoveler': return createShoveler(ctx, startX, startZ)
    default: return createDabbler(ctx, startX, startZ, dabblerFor(ctx.species))
  }
}

/** How a swimmer of this style and species keeps company, for the spawner to start it among its flock. */
export function companyOf(foraging?: Foraging, species?: string): Company {
  const S = foraging === 'shoveler' ? SHOVELER : dabblerFor(species)
  return { radius: S.flock.radius, retargetSeconds: S.flock.retargetSeconds, spacing: S.spacing }
}
