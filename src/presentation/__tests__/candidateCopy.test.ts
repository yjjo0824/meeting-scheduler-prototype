import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { computeSchedule } from '../../engine/computeSchedule'
import { formatSacrifice, formatTierOne } from '../candidateCopy'

const result = computeSchedule(RAW_SEED)
const [group1, group2, group3] = result.groups
const people = RAW_SEED.people

describe('candidateCopy — SPEC §4.3 예시 문구와 정확히 일치', () => {
  it('1층: "참석 6/6"', () => {
    expect(formatTierOne(group1, people)).toBe('참석 6/6')
  })

  it('1층: "참석 5/6 · 도윤 님(선택) 제외"', () => {
    expect(formatTierOne(group2, people)).toBe('참석 5/6 · 도윤 님(선택) 제외')
  })

  it('1층: "참석 4/6 · 도윤·수아 님(선택) 제외"', () => {
    expect(formatTierOne(group3, people)).toBe('참석 4/6 · 도윤·수아 님(선택) 제외')
  })

  it('2층: "서연 님 선호 1건 미반영"', () => {
    expect(formatSacrifice(group1, people)).toBe('서연 님 선호 1건 미반영')
  })

  it('2층: 도윤 제외 그룹은 선택 참석자 제외 문구를 담는다', () => {
    expect(formatSacrifice(group2, people)).toContain('도윤 님 제외')
  })
})
