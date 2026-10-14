import type { BehaviorFactory } from './types'
import { createSwim } from './swim'
import { createWade } from './wade'
import { createProbe } from './probe'
import { createPerch } from './perch'
import { createKingfisher } from './kingfisher'

export const BEHAVIORS: Record<'swim' | 'wade' | 'probe' | 'perch' | 'kingfisher', BehaviorFactory> = {
  swim: createSwim,
  wade: createWade,
  probe: createProbe,
  perch: createPerch,
  kingfisher: createKingfisher,
}

export type { BehaviorContext, BehaviorController, BehaviorFactory, CallAsk, Perch } from './types'
export { turnToward, approach, polygonOf, perchOf } from './types'
