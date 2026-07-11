import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { parseChips } from '../ruleBasedParser'

function person(id: string) {
  return RAW_SEED.people.find((p) => p.id === id)!
}

describe('parseChips — 도윤 원문 재현', () => {
  const doyun = person('doyun')
  const result = parseChips({ raw: doyun.response.raw!, calendarEvents: doyun.calendar, grid: RAW_SEED.grid })

  it('불가 1 · 병합 1 · 회피 1로 정확히 분류된다', () => {
    const counts = result.reduce<Record<string, number>>((acc, chip) => {
      acc[chip.type] = (acc[chip.type] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ 불가: 1, 병합: 1, 회피: 1 })
  })

  it('type/day/hours가 seed.people의 도윤 response.chips와 정확히 일치한다', () => {
    const simplified = result.map(({ type, day, hours }) => ({ type, day, hours }))
    const expected = doyun.response.chips.map(({ type, day, hours }) => ({ type, day, hours }))
    expect(simplified).toEqual(expected)
  })

  it('월요일 17시는 도윤의 캘린더(개인 일정)와 대조되어 병합으로 판별된다', () => {
    const merged = result.find((c) => c.type === '병합')
    expect(merged).toBeDefined()
    expect(merged).toMatchObject({ day: '월', hours: [17] })
    // 캘린더에 없는 슬롯이었다면(예: 화요일 17시) 같은 문장이라도 병합이 아니라 불가로 판별되어야 한다.
    expect(doyun.calendar.some((ev) => ev.day === '월' && ev.hours.includes(17))).toBe(true)
  })

  it('수요일 14~17시는 캘린더에 없으므로 불가로 판별된다(캘린더 대조 결과)', () => {
    const unavailable = result.find((c) => c.type === '불가')
    expect(unavailable).toMatchObject({ day: '수', hours: [14, 15, 16, 17] })
  })

  it('금요일 17시는 회피 표현("웬만하면")으로 판별된다', () => {
    const avoid = result.find((c) => c.type === '회피')
    expect(avoid).toMatchObject({ day: '금', hours: [17] })
  })

  it('사유·원문은 엔진 계산에 쓰이지 않는 cue 필드에만 남고, chip 자체는 type/day/hours로 판별 가능하다', () => {
    for (const chip of result) {
      expect(chip.type).toBeTruthy()
      expect(Array.isArray(chip.hours)).toBe(true)
    }
  })
})

describe('parseChips — 수아 원문 재현(전체 병합)', () => {
  const sua = person('sua')
  const result = parseChips({ raw: sua.response.raw!, calendarEvents: sua.calendar, grid: RAW_SEED.grid })

  it('응답 전체가 병합으로 판별된다', () => {
    expect(result.every((c) => c.type === '병합')).toBe(true)
    expect(result.length).toBe(2)
  })

  it('type/day/hours가 seed.people의 수아 response.chips와 정확히 일치한다', () => {
    const simplified = result.map(({ type, day, hours }) => ({ type, day, hours }))
    const expected = sua.response.chips.map(({ type, day, hours }) => ({ type, day, hours }))
    expect(simplified).toEqual(expected)
  })

  it('화요일 종일은 캘린더의 외부 교육(9~17시)과 정확히 겹쳐 병합된다', () => {
    const tuesday = result.find((c) => c.day === '화')
    expect(tuesday).toMatchObject({ type: '병합', hours: [9, 10, 11, 13, 14, 15, 16, 17] })
  })

  it('월요일 저녁은 캘린더의 대학원 수업(17시)과 겹쳐 병합된다', () => {
    const monday = result.find((c) => c.day === '월')
    expect(monday).toMatchObject({ type: '병합', hours: [17] })
  })
})

describe('parseChips — 일반 규칙 검증(캘린더가 없으면 같은 문장도 불가로 판별된다)', () => {
  it('캘린더 대조 없이 동일한 서술이면 병합이 아니라 불가가 된다(도윤 월17을 캘린더 없이 파싱)', () => {
    const doyun = person('doyun')
    const result = parseChips({ raw: doyun.response.raw!, calendarEvents: [], grid: RAW_SEED.grid })
    const mondayChip = result.find((c) => c.day === '월')
    expect(mondayChip?.type).toBe('불가')
  })
})

describe('parseChips — 미분류 처리', () => {
  it('요일·시간을 읽을 수 없는 문장은 미분류 칩으로 남는다(조용히 버리지 않음)', () => {
    const result = parseChips({
      raw: '아무 때나 괜찮은데 그날은 조금 애매해요',
      calendarEvents: [],
      grid: RAW_SEED.grid,
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((c) => c.type === '미분류')).toBe(true)
    expect(result[0].hours).toEqual([])
  })
})
