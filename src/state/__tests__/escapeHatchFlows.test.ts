import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { appReducer, buildInitialState } from '../appReducer'
import { applyCalendarCorrections, deriveEffectivePeople } from '../useSchedule'
import { computeSchedule } from '../../engine/computeSchedule'

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
}

function schedule(state: ReturnType<typeof buildInitialState>) {
  const corrected = applyCalendarCorrections(state.people, state.calendarCorrections, RAW_SEED.grid)
  const effective = deriveEffectivePeople(corrected, state.hasResponded)
  return computeSchedule(RAW_SEED, effective)
}

// 자유 모드에서 실제 UI가 디스패치하는 것과 동일한 액션 시퀀스로 탈출구 3종을 재현한다.
// (HostDashboard 행 클릭 → ParticipantPhoneFrame 오픈 → 정정/삭제 → 즉시 재계산)
describe('자유 모드 탈출구 3종 — 클릭 경로와 동일한 액션 시퀀스', () => {
  function postResponseState() {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    return state
  }

  it('탈출구1: 하늘의 응답 현황 행 클릭 → 마감 리뷰(금14) 카드에서 [옮길 수 있어요] → 금14 완벽', () => {
    let state = postResponseState()
    expect(schedule(state).perfectSlots).toEqual([])

    // HostDashboard 행 클릭
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'haneul' })
    // CalendarPrefillList의 [옮길 수 있어요] 클릭
    state = appReducer(state, {
      type: 'APPLY_CALENDAR_CORRECTION',
      personId: 'haneul',
      day: '금',
      hour: 14,
      kind: 'movable',
    })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })

    const result = schedule(state)
    expect(result.perfectSlots).toContainEqual({ day: '금', hour: 14 })
    expect(RAW_SEED.expected.escapes[0].result).toEqual({ day: '금', hour: 14, becomes: 'perfect' })
  })

  it('탈출구2: 도윤의 응답 현황 행 클릭 → [불가] 수요일 오후 칩 삭제 → 즉시 수14 완벽(재제출 없이)', () => {
    let state = postResponseState()

    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    const withoutUnavailable = doyun().response.chips.filter((c) => c.type !== '불가')
    // ParticipantPhoneFrame.handleChipsChange: 이미 응답한 사람은 삭제 즉시 UPDATE_CHIPS를 디스패치한다.
    state = appReducer(state, { type: 'UPDATE_CHIPS', personId: 'doyun', chips: withoutUnavailable })

    // 프레임을 닫기 전(재제출 없이)에도 이미 반영되어 있어야 한다 — "즉시 재계산".
    const resultBeforeClose = schedule(state)
    expect(resultBeforeClose.perfectSlots).toContainEqual({ day: '수', hour: 14 })

    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })
    expect(schedule(state).perfectSlots).toContainEqual({ day: '수', hour: 14 })
    expect(RAW_SEED.expected.escapes[1].result).toEqual({ day: '수', hour: 14, becomes: 'perfect' })
  })

  it('탈출구3: 서연의 응답 현황 행 클릭 → [회피] 13시 칩 삭제 → 금13이 유일한 완벽 슬롯', () => {
    let state = postResponseState()

    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'seoyeon' })
    state = appReducer(state, { type: 'UPDATE_CHIPS', personId: 'seoyeon', chips: [] })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })

    const result = schedule(state)
    expect(result.perfectSlots).toEqual([{ day: '금', hour: 13 }])
    expect(RAW_SEED.expected.escapes[2].result).toEqual({ day: '금', hour: 13, becomes: 'perfect' })
  })

  it('세 탈출구 모두 원본 seed 데이터를 변경하지 않는다(정정은 계산 레이어에만 반영)', () => {
    let state = postResponseState()
    state = appReducer(state, {
      type: 'APPLY_CALENDAR_CORRECTION',
      personId: 'haneul',
      day: '금',
      hour: 14,
      kind: 'movable',
    })
    state = appReducer(state, { type: 'UPDATE_CHIPS', personId: 'seoyeon', chips: [] })

    const haneulOriginal = RAW_SEED.people.find((p) => p.id === 'haneul')!
    const seoyeonOriginal = RAW_SEED.people.find((p) => p.id === 'seoyeon')!
    expect(haneulOriginal.calendar.some((e) => e.day === '금' && e.hours.includes(14))).toBe(true)
    expect(seoyeonOriginal.response.chips.length).toBeGreaterThan(0)
  })
})
