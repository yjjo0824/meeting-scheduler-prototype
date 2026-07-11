import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { buildConditionSets } from '../conditionSets'
import { generateCandidates } from '../candidates'
import { groupCandidates } from '../groups'

const grid = RAW_SEED.grid
const weights = RAW_SEED.cost_weights
const exp = RAW_SEED.expected
const sets = buildConditionSets(RAW_SEED.people, grid)
const candidates = generateCandidates(grid, sets, weights)
const groups = groupCandidates(candidates, sets.allIds.length)

describe('verify_seed.py 패리티 — 후보군 그룹핑(R2, 표시 레이어)', () => {
  it('후보군 개수', () => {
    expect(groups.length).toBe(exp.candidate_groups_post.length)
  })

  it.each(exp.candidate_groups_post)('후보군 rank $rank (제외 $excluded)', (eg) => {
    const group = groups[eg.rank - 1]
    expect(group.excluded).toEqual(eg.excluded)
    expect(group.prefUnmet).toEqual(eg.pref_unmet)
    expect(group.cost).toBe(eg.cost)
    expect(group.slots).toEqual(eg.slots.map((s) => ({ day: s.day, hour: s.hour })))
    expect(group.defaultSlot).toEqual({ day: eg.default_slot.day, hour: eg.default_slot.hour })
    expect(group.attendingCount).toBe(sets.allIds.length - eg.excluded.length)
    expect(group.totalInvited).toBe(sets.allIds.length)
  })

  it('엔진은 attendCount 문자열을 만들지 않는다 — 숫자만 반환(표시는 presentation 레이어 책임)', () => {
    for (const group of groups) {
      expect(typeof group.attendingCount).toBe('number')
      expect(typeof group.totalInvited).toBe('number')
      expect(group).not.toHaveProperty('attendCount')
    }
  })
})
