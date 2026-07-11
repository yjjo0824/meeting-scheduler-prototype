import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { buildConditionSets } from '../conditionSets'
import { generateCandidates } from '../candidates'

const grid = RAW_SEED.grid
const weights = RAW_SEED.cost_weights
const exp = RAW_SEED.expected
const sets = buildConditionSets(RAW_SEED.people, grid)
const candidates = generateCandidates(grid, sets, weights)

describe('verify_seed.py 패리티 — 후보 생성(R1 최소 제외 집합)', () => {
  it('추천 1안', () => {
    const top = exp.recommendation_post.top
    expect(candidates[0].slot).toEqual({ day: top.day, hour: top.hour })
    expect(candidates[0].cost).toBe(top.cost)
  })

  it('대안(다른 포기 내용)', () => {
    const alt = exp.recommendation_post.alternative
    const firstDifferent = candidates.find((c) => c.groupKey !== candidates[0].groupKey)
    expect(firstDifferent).toBeDefined()
    expect(firstDifferent!.slot).toEqual({ day: alt.day, hour: alt.hour })
    expect(firstDifferent!.cost).toBe(alt.cost)
  })

  it('상위 두 후보의 포기 내용이 다름', () => {
    const firstDifferent = candidates.find((c) => c.groupKey !== candidates[0].groupKey)
    expect(firstDifferent!.groupKey).not.toBe(candidates[0].groupKey)
  })

  it('가중치 불변식: optional_attendance > optional_preference', () => {
    expect(weights.optional_attendance).toBeGreaterThan(weights.optional_preference)
  })
})
