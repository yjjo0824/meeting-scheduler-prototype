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

describe('parseChips — 복수 조건 접속사 분할(§6, 이 목록만 지원: 쉼표·과/와/이랑/랑/그리고)', () => {
  it('"목요일 오전이랑 수요일 오후는 안 돼요" → 불가 칩 2개', () => {
    const result = parseChips({
      raw: '목요일 오전이랑 수요일 오후는 안 돼요',
      calendarEvents: [],
      grid: RAW_SEED.grid,
    })

    expect(result).toHaveLength(2)
    expect(result.every((c) => c.type === '불가')).toBe(true)
    expect(result[0]).toMatchObject({ day: '목', hours: [9, 10, 11] })
    expect(result[1]).toMatchObject({ day: '수', hours: [14, 15, 16, 17] })
  })

  it('"금요일 오후와 월요일 오전은 피하고 싶어요" → "와"로 절이 2개로 나뉜다(마커 전파는 지원하지 않음 — 최소 범위)', () => {
    const result = parseChips({
      raw: '금요일 오후와 월요일 오전은 피하고 싶어요',
      calendarEvents: [],
      grid: RAW_SEED.grid,
    })

    // 뒤 절만 명시적 마커("피하고 싶어요")를 담고 있어 회피로 판별된다.
    // 마커 없는 앞 절은 절 분할 전 문장처럼 기본값 규칙(캘린더 미보유 → 불가)을 그대로 따른다 —
    // 접속사 뒤의 마커를 앞 절까지 전파하는 것은 "이 접속사 목록만 지원"의 범위를 넘는 일반화라 하지 않는다.
    expect(result).toHaveLength(2)
    expect(result[1]).toMatchObject({ type: '회피', day: '월', hours: [9, 10, 11] })
  })

  it('"화요일 오전 그리고 목요일 오후는 안 돼요" → 불가 칩 2개("그리고" 분할)', () => {
    const result = parseChips({
      raw: '화요일 오전 그리고 목요일 오후는 안 돼요',
      calendarEvents: [],
      grid: RAW_SEED.grid,
    })

    expect(result).toHaveLength(2)
    expect(result.every((c) => c.type === '불가')).toBe(true)
  })

  it('접속사 분할이 도윤·수아 원문 파싱 결과를 회귀시키지 않는다', () => {
    const doyun = person('doyun')
    const result = parseChips({ raw: doyun.response.raw!, calendarEvents: doyun.calendar, grid: RAW_SEED.grid })
    const counts = result.reduce<Record<string, number>>((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ 불가: 1, 병합: 1, 회피: 1 })
  })
})
