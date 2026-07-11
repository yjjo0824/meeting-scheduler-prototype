import type { Person, Seed } from '../types/domain'
import type { ScheduleResult } from '../types/engine'
import { buildConditionSets } from './conditionSets'
import { generateCandidates } from './candidates'
import { groupCandidates } from './groups'
import { perfectSlots } from './perfect'

export function computeSchedule(seed: Seed, peopleOverride?: Person[]): ScheduleResult {
  const people = peopleOverride ?? seed.people
  const sets = buildConditionSets(people, seed.grid)

  const perfect = perfectSlots(sets.hard, sets.soft, sets.allIds, seed.grid)
  const candidates = generateCandidates(seed.grid, sets, seed.cost_weights)
  const groups = groupCandidates(candidates, sets.allIds.length)

  return { perfectSlots: perfect, candidates, groups }
}
