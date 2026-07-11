import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { buildConditionSets } from '../conditionSets'
import { hardBlockers, perfectSlots, softViolators } from '../perfect'
import { allSlots, slotKey } from '../slotKey'

// verify_seed.py의 체크 중 candidates.ts/groups.ts 없이 conditionSets+perfect만으로
// 재현 가능한 항목들을 1:1로 이식한다. 나머지(추천/대안/그룹핑/응답 전/탈출구)는
// 2·3단계에서 candidates.ts·groups.ts가 추가된 뒤 별도 스위트로 이어진다.

const grid = RAW_SEED.grid
const exp = RAW_SEED.expected
const sets = buildConditionSets(RAW_SEED.people, grid)

describe('verify_seed.py 패리티 — 완벽 슬롯 계산', () => {
  it('총 슬롯 수', () => {
    expect(allSlots(grid).length).toBe(exp.total_slots)
  })

  it('완벽 슬롯 없음 (전원 응답 후, ALL 그룹)', () => {
    expect(perfectSlots(sets.hard, sets.soft, sets.allIds, grid)).toEqual([])
  })

  it('전원 참석 슬롯', () => {
    const allAttend = allSlots(grid).filter(
      (slot) => hardBlockers(slot, sets.allIds, sets.hard).length === 0,
    )
    const actual = allAttend.map((s) => [s.day, s.hour])
    const expected = exp.all_attend_slots.map((e) => [e.day, e.hour])
    expect(actual).toEqual(expected)

    for (const e of exp.all_attend_slots) {
      const violators = softViolators({ day: e.day, hour: e.hour }, sets.allIds, sets.soft)
      expect(violators).toEqual(e.soft_violations)
    }
  })

  it('도윤/수아 제외 후보', () => {
    for (const [pid, key] of [
      ['doyun', 'candidates_exclude_doyun'],
      ['sua', 'candidates_exclude_sua'],
    ] as const) {
      const group = sets.allIds.filter((id) => id !== pid)
      const actual = perfectSlots(sets.hard, sets.soft, group, grid).map((s) => [s.day, s.hour])
      const expected = exp[key].map((e) => [e.day, e.hour])
      expect(actual).toEqual(expected)
    }
  })

  it('수아 단독 차단 슬롯 없음', () => {
    const soleSua = allSlots(grid).filter(
      (slot) => hardBlockers(slot, sets.allIds, sets.hard).join(',') === 'sua',
    )
    expect(soleSua).toEqual([])
  })

  it('slotKey 왕복(day#hour) 사고 방지', () => {
    expect(slotKey('금', 13)).toBe('금#13')
  })
})
