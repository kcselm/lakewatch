import type { BehaviorFactory } from './types'
import { createSwim } from './swim'
import { createWade } from './wade'
import { createProbe } from './probe'
import { createPerch } from './perch'
import { createHover } from './hover'

export const BEHAVIORS: Record<'swim' | 'wade' | 'probe' | 'perch' | 'hover', BehaviorFactory> = {
  swim: createSwim,
  wade: createWade,
  probe: createProbe,
  perch: createPerch,
  hover: createHover,
}

export type { BehaviorContext, BehaviorController, BehaviorFactory, Perch } from './types'
export { turnToward, approach, polygonOf, perchOf } from './types'
