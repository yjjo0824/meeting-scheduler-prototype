import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { computeSchedule } from '../computeSchedule'

// R7 디폴트: 미응답자는 캘린더 확정 일정만 반영, 선호는 없는 것으로 간주.
// "응답 전"은 별도 분기가 아니라, computeSchedule에 chips: []로 치환한 people
// 스냅샷을 넣는 것으로 재현된다 — 특수 코드 경로 없음을 보장하는 테스트.

function withoutResponse(personId: string) {
  return RAW_SEED.people.map((p) => (p.id === personId ? { ...p, response: { ...p.response, chips: [] } } : p))
}

describe('verify_seed.py 패리티 — 응답 전(R7 디폴트)', () => {
  const result = computeSchedule(RAW_SEED, withoutResponse('doyun'))

  it('응답 전 잠정 완벽 슬롯', () => {
    const expected = RAW_SEED.expected.pre_doyun_tentative_perfect.map((s) => ({ day: s.day, hour: s.hour }))
    expect(result.perfectSlots).toEqual(expected)
  })

  it('응답 전 잠정 추천', () => {
    const rec = RAW_SEED.expected.recommendation_pre_doyun
    expect(result.perfectSlots[0]).toEqual({ day: rec.day, hour: rec.hour })
  })
})
