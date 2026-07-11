import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { computeSchedule } from '../computeSchedule'

// RAW_SEED.people은 도윤 응답이 이미 반영된 "응답 후" 상태이므로,
// computeSchedule(RAW_SEED)는 seed.expected.candidate_groups_post를 직접 재현해야 한다.
// (peopleOverride 없이 호출 = 특수 분기가 아니라 기본 경로 자체가 이 시나리오임을 보장하는 테스트)

describe('computeSchedule — 단일 진입점', () => {
  const result = computeSchedule(RAW_SEED)

  it('완벽 슬롯 없음(응답 후)', () => {
    expect(result.perfectSlots).toEqual([])
  })

  it('후보군 3개, 랭킹 순서가 seed.expected.candidate_groups_post와 일치', () => {
    const exp = RAW_SEED.expected.candidate_groups_post
    expect(result.groups.length).toBe(exp.length)
    exp.forEach((eg, i) => {
      expect(result.groups[i].excluded).toEqual(eg.excluded)
      expect(result.groups[i].cost).toBe(eg.cost)
    })
  })

  it('peopleOverride 없이 호출하면 seed.people을 그대로 쓴다', () => {
    const withOverride = computeSchedule(RAW_SEED, RAW_SEED.people)
    expect(withOverride).toEqual(result)
  })
})
