import type { BehaviorFactory } from './types'
import { createSwim } from './swim'
import { createWade } from './wade'
import { createProbe } from './probe'

export const BEHAVIORS: Record<'swim' | 'wade' | 'probe', BehaviorFactory> = {
  swim: createSwim,
  wade: createWade,
  probe: createProbe,
}

export type { BehaviorContext, BehaviorController, BehaviorFactory } from './types'
export { turnToward, approach } from './types'
