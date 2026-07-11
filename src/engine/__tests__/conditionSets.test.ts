import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { buildConditionSets } from '../conditionSets'
import { slotKey } from '../slotKey'
import type { Person } from '../../types/domain'

describe('buildConditionSets — seed 데이터', () => {
  it('seed.json 전체에 대해 예외 없이 빌드된다(병합·조정가능 subset assert 통과)', () => {
    expect(() => buildConditionSets(RAW_SEED.people, RAW_SEED.grid)).not.toThrow()
  })

  it('민준의 회피 칩은 soft에만 반영되고 hard에는 반영되지 않는다', () => {
    const sets = buildConditionSets(RAW_SEED.people, RAW_SEED.grid)
    const key = slotKey('수', 9)
    expect(sets.soft.minjun.has(key)).toBe(true)
    expect(sets.hard.minjun.has(key)).toBe(false)
  })

  it('하늘의 조정가능 칩은 flexible에 반영되고 hard는 유지된다(여전히 하드 제약)', () => {
    const sets = buildConditionSets(RAW_SEED.people, RAW_SEED.grid)
    const key = slotKey('금', 14)
    expect(sets.flexible.haneul.has(key)).toBe(true)
    expect(sets.hard.haneul.has(key)).toBe(true)
  })

  it('도윤의 병합 칩(월17)은 캘린더 하드와 겹치고, 불가 칩(수 14~17)은 hard에 추가된다', () => {
    const sets = buildConditionSets(RAW_SEED.people, RAW_SEED.grid)
    expect(sets.hard.doyun.has(slotKey('월', 17))).toBe(true)
    for (const hour of [14, 15, 16, 17]) {
      expect(sets.hard.doyun.has(slotKey('수', hour))).toBe(true)
    }
    expect(sets.soft.doyun.has(slotKey('금', 17))).toBe(true)
  })

  it('서연의 회피 칩(day: "*", 13시)은 모든 요일의 13시로 확장된다', () => {
    const sets = buildConditionSets(RAW_SEED.people, RAW_SEED.grid)
    for (const day of RAW_SEED.grid.days) {
      expect(sets.soft.seoyeon.has(slotKey(day, 13))).toBe(true)
    }
  })

  it('requiredIds/optionalIds는 people 배열 순서를 유지하고, allIds는 필수 다음 선택 순서다', () => {
    const sets = buildConditionSets(RAW_SEED.people, RAW_SEED.grid)
    expect(sets.requiredIds).toEqual(['jiwon', 'minjun', 'seoyeon', 'haneul'])
    expect(sets.optionalIds).toEqual(['doyun', 'sua'])
    expect(sets.allIds).toEqual(['jiwon', 'minjun', 'seoyeon', 'haneul', 'doyun', 'sua'])
  })
})

describe('buildConditionSets — subset assert 위반', () => {
  const grid = RAW_SEED.grid

  function personWith(chips: Person['response']['chips']): Person {
    return {
      id: 'test',
      name: '테스트',
      job: '테스터',
      attendance: 'required',
      is_organizer: false,
      calendar: [{ title: '일정', day: '월', hours: [9] }],
      response: { raw: null, chips },
    }
  }

  it('캘린더에 없는 슬롯을 가리키는 병합 칩은 assert에 걸린다', () => {
    const person = personWith([{ type: '병합', day: '화', hours: [10] }])
    expect(() => buildConditionSets([person], grid)).toThrow(/병합 칩 오류/)
  })

  it('하드 제약이 아닌 슬롯을 가리키는 조정가능 칩은 assert에 걸린다', () => {
    const person = personWith([{ type: '조정가능', day: '화', hours: [10] }])
    expect(() => buildConditionSets([person], grid)).toThrow(/조정가능 칩 오류/)
  })
})
