import type { SpeciesSpec, MarkKey } from '../birds/spec'
import { MARK_KEYS } from '../birds/spec'

export interface IdSession { targetId: number; species: string; misses: number }
export const MAX_MISSES = 3

export type Judgement =
  | { result: 'correct' }
  | { result: 'wrong'; hint: string; session: IdSession }
  | { result: 'revealed'; species: string }

const VERB: Record<MarkKey, string> = { size: 'is', bill: 'has', head: 'has', body: 'has', legs: 'has' }
const GENERIC = 'Look again at the bill and the overall shape.'

export function buildHint(
  guessName: string,
  guessMarks: Record<MarkKey, string> | null,
  truthMarks: Record<MarkKey, string> | null,
  misses: number,
): string {
  if (!guessMarks || !truthMarks) return `Not a ${guessName}. ${GENERIC}`
  const differing = MARK_KEYS.filter(k => guessMarks[k] !== truthMarks[k])
  if (differing.length === 0) return `Not a ${guessName}. ${GENERIC}`
  const key = differing[misses % differing.length]!
  return `Not a ${guessName}. Check the ${key}: a ${guessName} ${VERB[key]} ${guessMarks[key]}.`
}

export function judge(
  session: IdSession,
  guess: string,
  specs: Record<string, SpeciesSpec>,
  names: (code: string) => string,
): Judgement {
  if (guess === session.species) return { result: 'correct' }
  const misses = session.misses + 1
  if (misses >= MAX_MISSES) return { result: 'revealed', species: session.species }
  const hint = buildHint(names(guess), specs[guess]?.marks ?? null, specs[session.species]?.marks ?? null, session.misses)
  return { result: 'wrong', hint, session: { ...session, misses } }
}

export function fieldMarkFor(code: string, specs: Record<string, SpeciesSpec>): string | null {
  return specs[code]?.marks.bill ?? null
}
