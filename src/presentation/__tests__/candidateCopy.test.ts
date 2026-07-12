import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { computeSchedule } from '../../engine/computeSchedule'
import { formatAttendCount, formatConsiderations, formatPositiveLine } from '../candidateCopy'
import { formatSlotLabel, formatSlotWithDate, formatSlotsRangeLabel } from '../dateDisplay'

const result = computeSchedule(RAW_SEED)
const [group1, group2, group3] = result.groups
const people = RAW_SEED.people
const display = RAW_SEED.schedule_display

describe('candidateCopy — 플랫 정보 줄(긍정 정보, 12C-12)', () => {
  it('제외자 없는 추천안: "6명 모두 참석할 수 있어요"', () => {
    expect(formatPositiveLine(group1)).toBe('6명 모두 참석할 수 있어요')
  })

  it('도윤 제외 대안(참석자 선호 전부 충족): "참석하는 5명의 선호는 모두 반영해요"', () => {
    expect(formatPositiveLine(group2)).toBe('참석하는 5명의 선호는 모두 반영해요')
  })

  it('도윤·수아 제외 대안: "참석하는 4명의 선호는 모두 반영해요"', () => {
    expect(formatPositiveLine(group3)).toBe('참석하는 4명의 선호는 모두 반영해요')
  })
})

describe('candidateCopy — 참석 집계(분모 고정, 사람 단위 — SPEC §4.3 1층 원칙)', () => {
  it('분모는 항상 전체 초대 인원이다: 참석 6/6 · 5/6 · 4/6', () => {
    expect(formatAttendCount(group1)).toBe('참석 6/6')
    expect(formatAttendCount(group2)).toBe('참석 5/6')
    expect(formatAttendCount(group3)).toBe('참석 4/6')
  })
})

describe('candidateCopy — 고려할 점(주체 명시, 사용자 언어 — SPEC §4.3 2층 원칙, 12C-12)', () => {
  it('추천안(서연 선호 미반영): "서연 님이 피하고 싶은 시간 1건과 겹쳐요."', () => {
    expect(formatConsiderations(group1, people)).toEqual(['서연 님이 피하고 싶은 시간 1건과 겹쳐요.'])
  })

  it('도윤 제외 대안: 참석 구분(선택)과 함께 제외 사실을 말한다', () => {
    expect(formatConsiderations(group2, people)).toEqual(['선택 참석자인 도윤 님은 참석하지 않아요.'])
  })

  it('도윤·수아 제외 대안: 두 사람의 제외가 참석 구분과 함께 드러난다', () => {
    expect(formatConsiderations(group3, people)).toEqual(['선택 참석자인 도윤 님과 수아 님은 참석하지 않아요.'])
  })

  it('cost 숫자는 어떤 문구에도 노출되지 않는다', () => {
    // group3의 cost(6)는 분모 "6"과 문자가 겹치므로, cost가 고유한 group1(2)·group2(3)로 검증한다.
    expect(`${formatPositiveLine(group1)} ${formatConsiderations(group1, people).join(' ')}`).not.toContain(
      String(group1.cost),
    )
    expect(`${formatPositiveLine(group2)} ${formatConsiderations(group2, people).join(' ')}`).not.toContain(
      String(group2.cost),
    )
  })
})

describe('dateDisplay — 슬롯 라벨(사용자 언어 시각 표기)', () => {
  it('단일 슬롯: "금요일 오후 1시"', () => {
    expect(formatSlotLabel({ day: '금', hour: 13 })).toBe('금요일 오후 1시')
  })

  it('오전 슬롯: "월요일 오전 9시"', () => {
    expect(formatSlotLabel({ day: '월', hour: 9 })).toBe('월요일 오전 9시')
  })

  it('같은 요일 연속 슬롯 범위: 수14~17 → "수요일 오후 2–5시"', () => {
    expect(formatSlotsRangeLabel(group2.slots)).toBe('수요일 오후 2–5시')
  })

  it('슬롯 1개 그룹: 월17 → "월요일 오후 5시"', () => {
    expect(formatSlotsRangeLabel(group3.slots)).toBe('월요일 오후 5시')
  })
})

describe('dateDisplay — 날짜 포함 슬롯 제목(12C-12, schedule_display 파생 — 하드코딩 금지)', () => {
  it('window_start_date(2026-07-13 월) 기준: 금13 → "7월 17일 금요일 오후 1시"', () => {
    expect(formatSlotWithDate({ day: '금', hour: 13 }, display)).toBe('7월 17일 금요일 오후 1시')
  })

  it('수14 → "7월 15일 수요일 오후 2시", 월17 → "7월 13일 월요일 오후 5시"', () => {
    expect(formatSlotWithDate({ day: '수', hour: 14 }, display)).toBe('7월 15일 수요일 오후 2시')
    expect(formatSlotWithDate({ day: '월', hour: 17 }, display)).toBe('7월 13일 월요일 오후 5시')
  })
})
