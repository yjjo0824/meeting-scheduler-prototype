import type { Candidate, CandidateGroup } from '../types/engine'
import { assertInvariant } from './invariants'

export function groupCandidates(candidates: Candidate[], totalInvited: number): CandidateGroup[] {
  const groups: CandidateGroup[] = []
  const indexByKey = new Map<string, number>()

  for (const candidate of candidates) {
    let index = indexByKey.get(candidate.groupKey)
    if (index === undefined) {
      index = groups.length
      indexByKey.set(candidate.groupKey, index)
      groups.push({
        key: candidate.groupKey,
        excluded: candidate.excluded,
        prefUnmet: candidate.prefUnmet,
        cost: candidate.cost,
        slots: [],
        defaultSlot: candidate.slot,
        attendingCount: totalInvited - candidate.excluded.length,
        totalInvited,
      })
    }

    const group = groups[index]
    assertInvariant(group.cost === candidate.cost, `그룹 내 비용 불일치: ${JSON.stringify(candidate)}`)
    group.slots.push(candidate.slot)
  }

  return groups
}
