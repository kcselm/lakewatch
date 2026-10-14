import type { BehaviorFactory } from './types'
import { createSwim } from './swim'
import { createWade } from './wade'
import { createProbe } from './probe'
import { createPerch } from './perch'
import { createKingfisher } from './kingfisher'
import { createBlackbird } from './blackbird'

export const BEHAVIORS: Record<'swim' | 'wade' | 'probe' | 'perch' | 'kingfisher' | 'blackbird', BehaviorFactory> = {
  swim: createSwim,
  wade: createWade,
  probe: createProbe,
  perch: createPerch,
  kingfisher: createKingfisher,
  blackbird: createBlackbird,
}

export type { BehaviorContext, BehaviorController, BehaviorFactory, CallAsk, Perch } from './types'
export { turnToward, approach, polygonOf, perchOf } from './types'
