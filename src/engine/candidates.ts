import type { CostWeights, Grid } from '../types/domain'
import type { Candidate } from '../types/engine'
import { assertInvariant } from './invariants'
import { hardBlockers } from './perfect'
import { allSlots, slotKey } from './slotKey'
import type { ConditionSets } from './conditionSets'

export function generateCandidates(grid: Grid, sets: ConditionSets, weights: CostWeights): Candidate[] {
  assertInvariant(
    weights.optional_attendance > weights.optional_preference,
    '가중치 불변식 위반: optional_attendance > optional_preference',
  )

  const candidates: Candidate[] = []

  for (const slot of allSlots(grid)) {
    if (hardBlockers(slot, sets.requiredIds, sets.hard).length > 0) continue

    const key = slotKey(slot.day, slot.hour)
    const excluded = sets.optionalIds.filter((id) => sets.hard[id].has(key))
    const attendees = sets.allIds.filter((id) => !excluded.includes(id))
    const prefUnmet = attendees.filter((id) => sets.soft[id].has(key))

    const cost =
      excluded.length * weights.optional_attendance +
      prefUnmet.reduce(
        (sum, id) =>
          sum +
          (sets.attendanceById[id] === 'required' ? weights.required_preference : weights.optional_preference),
        0,
      )

    candidates.push({
      slot,
      cost,
      excluded,
      prefUnmet,
      groupKey: `${excluded.join(',')}|${prefUnmet.join(',')}`,
    })
  }

  const dayIndex = (day: string) => grid.days.indexOf(day as Grid['days'][number])
  candidates.sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost
    const dayDiff = dayIndex(a.slot.day) - dayIndex(b.slot.day)
    if (dayDiff !== 0) return dayDiff
    return a.slot.hour - b.slot.hour
  })

  return candidates
}
