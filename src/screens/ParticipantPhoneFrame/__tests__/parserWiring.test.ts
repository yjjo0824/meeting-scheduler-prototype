import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { parseChips } from '../../../parser/ruleBasedParser'

// ParticipantPhoneFrame.handleDraftChange가 실제로 호출하는 것과 동일한 인자 계약
// (raw, calendarEvents: person.calendar, grid: RAW_SEED.grid)로 파서를 호출해,
// 도윤 원문 입력 시 화면 칩이 seed의 response.chips와 정확히 일치함을 재확인한다.
describe('ParticipantPhoneFrame — 파서 연결 계약(6단계 파서 재사용)', () => {
  it('도윤 원문 → 도윤 캘린더로 파싱하면 불가1·병합1·회피1, seed.response.chips와 정확히 일치', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const result = parseChips({ raw: doyun.response.raw!, calendarEvents: doyun.calendar, grid: RAW_SEED.grid })

    const counts = result.reduce<Record<string, number>>((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ 불가: 1, 병합: 1, 회피: 1 })

    const simplified = result.map(({ type, day, hours }) => ({ type, day, hours }))
    const expected = doyun.response.chips.map(({ type, day, hours }) => ({ type, day, hours }))
    expect(simplified).toEqual(expected)
  })
})
