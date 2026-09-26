import type { BehaviorContext, BehaviorController } from './types'
import { createDabbler, MALLARD } from './dabbler'
import type { Company } from './swimmer'
import type { Foraging } from '../birds/spec'

/**
 * Swim in the species' style. No style, or a probing one (validateCast rejects that), swims as a dabbler. Until each
 * style has its own state machine, it swims as a dabbler too.
 */
export function createSwim(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  switch (ctx.foraging) {
    default: return createDabbler(ctx, startX, startZ)
  }
}

/** How a swimmer of this style and species keeps company, for the spawner to start it among its flock. */
export function companyOf(_foraging?: Foraging, _species?: string): Company {
  const S = MALLARD
  return { radius: S.flock.radius, retargetSeconds: S.flock.retargetSeconds, spacing: S.spacing }
}
