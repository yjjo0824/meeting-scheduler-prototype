import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { slotKey } from '../../engine/slotKey'
import { applyCalendarCorrections } from '../useSchedule'

function haneul() {
  return RAW_SEED.people.find((p) => p.id === 'haneul')!
}

// 12B-1 QA 수정: '옮길 수 있어요'(movable)와 '이 시간 비어 있어요'(empty)는 계산 레이어에서
// 서로 다른 효과를 가져야 한다 — 이전에는 둘 다 캘린더에서 시간을 제거해 동일하게 동작했다.
describe('applyCalendarCorrections — movable과 empty는 서로 다른 correction이다', () => {
  it('movable 정정은 캘린더 시간을 그대로 둔다(하드 제약 유지, 재계산에 영향 없음)', () => {
    const [corrected] = applyCalendarCorrections(
      [haneul()],
      { haneul: { [slotKey('금', 14)]: { kind: 'movable' } } },
      RAW_SEED.grid,
    )
    const original = haneul()
    expect(corrected.calendar).toEqual(original.calendar)
    // 하드 제약이 그대로이므로, 이 슬롯을 가리키던 조정가능 칩도 여전히 유효(부분집합)해 남아 있다.
    expect(corrected.response.chips).toEqual(original.response.chips)
  })

  it('empty 정정은 그 시간을 캘린더에서 제거한다(하드 제약 해제)', () => {
    const [corrected] = applyCalendarCorrections(
      [haneul()],
      { haneul: { [slotKey('금', 14)]: { kind: 'empty' } } },
      RAW_SEED.grid,
    )
    const friday = corrected.calendar.filter((e) => e.day === '금')
    expect(friday.every((e) => !e.hours.includes(14))).toBe(true)
    // 금14가 캘린더에서 사라졌으니, 그 슬롯을 가리키던 조정가능 칩은 더 이상 하드 제약의 부분집합이
    // 아니게 되어 함께 걸러진다(엔진의 subset invariant 유지).
    expect(corrected.response.chips.some((c) => c.type === '조정가능' && c.day === '금' && c.hours.includes(14))).toBe(
      false,
    )
  })

  it('원본 seed의 haneul 데이터는 두 경우 모두 변하지 않는다(R5)', () => {
    const original = haneul()
    applyCalendarCorrections([haneul()], { haneul: { [slotKey('금', 14)]: { kind: 'movable' } } }, RAW_SEED.grid)
    applyCalendarCorrections([haneul()], { haneul: { [slotKey('금', 14)]: { kind: 'empty' } } }, RAW_SEED.grid)
    expect(haneul()).toEqual(original)
  })
})
