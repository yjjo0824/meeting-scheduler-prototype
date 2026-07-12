import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { computeSchedule } from '../../engine/computeSchedule'
import { formatAttendSummary, formatUnmetConditions } from '../candidateCopy'
import { formatSlotLabel, formatSlotsRangeLabel } from '../dateDisplay'

const result = computeSchedule(RAW_SEED)
const [group1, group2, group3] = result.groups
const people = RAW_SEED.people

describe('candidateCopy — 참석 인원(분모 고정, 사람 단위 — SPEC §4.3 1층 원칙)', () => {
  it('제외자 없는 추천안: "6명 모두 참석"', () => {
    expect(formatAttendSummary(group1)).toBe('6명 모두 참석')
  })

  it('도윤 제외 대안: "5 / 6명 참석" — 분모는 항상 전체 초대 인원', () => {
    expect(formatAttendSummary(group2)).toBe('5 / 6명 참석')
  })

  it('도윤·수아 제외 대안: "4 / 6명 참석"', () => {
    expect(formatAttendSummary(group3)).toBe('4 / 6명 참석')
  })
})

describe('candidateCopy — 반영하지 못한 조건(주체 명시, 사용자 언어 — SPEC §4.3 2층 원칙)', () => {
  it('추천안(서연 선호 미반영): "서연 님이 피하고 싶은 시간이에요."', () => {
    expect(formatUnmetConditions(group1, people)).toBe('서연 님이 피하고 싶은 시간이에요.')
  })

  it('도윤 제외 대안: 제외 사실 + 나머지 인원의 조건 충족을 함께 말한다', () => {
    expect(formatUnmetConditions(group2, people)).toBe(
      '도윤 님은 참석하지 않아요. 나머지 5명의 원하는 시간은 모두 지켜요.',
    )
  })

  it('도윤·수아 제외 대안: 두 사람의 제외가 모두 드러난다', () => {
    const text = formatUnmetConditions(group3, people)
    expect(text).toContain('도윤 님')
    expect(text).toContain('수아 님')
    expect(text).toContain('참석하지 않아요')
  })

  it('cost 숫자는 어떤 문구에도 노출되지 않는다', () => {
    // group3의 cost(6)는 분모 "6명"과 문자가 겹치므로, cost가 고유한 group1(2)·group2(3)로 검증한다.
    expect(`${formatAttendSummary(group1)} ${formatUnmetConditions(group1, people)}`).not.toContain(
      String(group1.cost),
    )
    expect(`${formatAttendSummary(group2)} ${formatUnmetConditions(group2, people)}`).not.toContain(
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
