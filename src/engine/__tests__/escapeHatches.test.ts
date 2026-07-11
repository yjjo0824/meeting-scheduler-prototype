import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { buildConditionSets } from '../conditionSets'
import { perfectSlots } from '../perfect'
import { slotKey } from '../slotKey'
import type { SlotKey } from '../../types/engine'

// verify_seed.py의 탈출구 3종 체크를 hard/soft 집합 조작 수준에서 1:1로 이식한다.
// (탈출구를 실제 UI 클릭 흐름으로 만드는 것은 11단계의 몫 — 여기서는 계산 결과만 검증)

const grid = RAW_SEED.grid
const sets = buildConditionSets(RAW_SEED.people, grid)

function cloneSets(source: Record<string, Set<SlotKey>>): Record<string, Set<SlotKey>> {
  const clone: Record<string, Set<SlotKey>> = {}
  for (const [id, keys] of Object.entries(source)) clone[id] = new Set(keys)
  return clone
}

describe('verify_seed.py 패리티 — 탈출구 3종', () => {
  it('탈출구1: 하늘의 금14 조정가능 적용 → 금14 완벽 슬롯에 포함', () => {
    const hard2 = cloneSets(sets.hard)
    for (const key of sets.flexible.haneul) hard2.haneul.delete(key)

    const result = perfectSlots(hard2, sets.soft, sets.allIds, grid)
    const target = RAW_SEED.expected.escapes[0].result
    expect(result).toContainEqual({ day: target.day, hour: target.hour })
  })

  it('탈출구2: 도윤의 수요일 오후 불가 제거 → 수14 완벽 슬롯에 포함', () => {
    const hard3 = cloneSets(sets.hard)
    for (const hour of [14, 15, 16, 17]) hard3.doyun.delete(slotKey('수', hour))

    const result = perfectSlots(hard3, sets.soft, sets.allIds, grid)
    const target = RAW_SEED.expected.escapes[1].result
    expect(result).toContainEqual({ day: target.day, hour: target.hour })
  })

  it('탈출구3: 서연의 13시 회피 해제 → 금13이 유일한 완벽 슬롯', () => {
    const soft2 = cloneSets(sets.soft)
    soft2.seoyeon = new Set()

    const result = perfectSlots(sets.hard, soft2, sets.allIds, grid)
    const target = RAW_SEED.expected.escapes[2].result
    expect(result).toEqual([{ day: target.day, hour: target.hour }])
  })
})
