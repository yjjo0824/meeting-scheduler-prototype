import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { appReducer, buildInitialState } from '../appReducer'
import { applyCalendarCorrections, deriveEffectivePeople } from '../useSchedule'
import { computeSchedule } from '../../engine/computeSchedule'
import { slotKey } from '../../engine/slotKey'

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
}

function haneul() {
  return RAW_SEED.people.find((p) => p.id === 'haneul')!
}

function schedule(state: ReturnType<typeof buildInitialState>) {
  const corrected = applyCalendarCorrections(state.people, state.calendarCorrections, RAW_SEED.grid)
  const effective = deriveEffectivePeople(corrected, state.hasResponded)
  return computeSchedule(RAW_SEED, effective)
}

// 자유 모드에서 실제 UI가 디스패치하는 것과 동일한 액션 시퀀스로 탈출구 3종을 재현한다.
// (HostDashboard 행 클릭 → ParticipantPhoneFrame 오픈 → 정정/삭제는 draft에만 머묾 →
//  [응답 보내기] = SUBMIT_RESPONSE 한 번으로 커밋 → 그 시점에만 재계산이 바뀐다. 항목 6:
//  정정·칩 편집은 더 이상 편집 즉시 dispatch되지 않으므로, reducer 레벨에서 재현 가능한
//  "즉시 반영" 지점은 이제 SUBMIT_RESPONSE 뿐이다.)
describe('자유 모드 탈출구 3종 — 클릭 경로와 동일한 액션 시퀀스', () => {
  function postResponseState() {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    return state
  }

  it('탈출구1: 하늘의 응답 현황 행 클릭 → 마감 리뷰(금14) 카드에서 [이 시간 비어 있어요] → 응답 보내기 → 금14 완벽', () => {
    let state = postResponseState()
    expect(schedule(state).perfectSlots).toEqual([])

    // HostDashboard 행 클릭
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'haneul' })

    // CalendarPrefillList의 [이 시간 비어 있어요] 클릭은 ParticipantPhoneFrame의 draftCorrections에만
    // 반영된다 — 아직 제출 전이므로 전역 계산은 바뀌지 않는다.
    const beforeSubmit = schedule(state)
    expect(beforeSubmit.perfectSlots).toEqual([])

    // [응답 보내기] = SUBMIT_RESPONSE로 draft가 한 번에 커밋된다. '옮길 수 있어요'(movable)는 하드
    // 제약을 유지하므로 실제로 슬롯을 여는 정정은 'empty'뿐이다(12B-1 QA 수정).
    state = appReducer(state, {
      type: 'SUBMIT_RESPONSE',
      personId: 'haneul',
      chips: haneul().response.chips,
      corrections: { [slotKey('금', 14)]: { kind: 'empty' } },
    })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })

    const result = schedule(state)
    expect(result.perfectSlots).toContainEqual({ day: '금', hour: 14 })
    expect(RAW_SEED.expected.escapes[0].result).toEqual({ day: '금', hour: 14, becomes: 'perfect' })
  })

  it('탈출구1 변형: [옮길 수 있어요]만 제출하면 금14는 완벽 슬롯이 되지 않는다(두 정정은 서로 다르다)', () => {
    let state = postResponseState()

    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'haneul' })
    state = appReducer(state, {
      type: 'SUBMIT_RESPONSE',
      personId: 'haneul',
      chips: haneul().response.chips,
      corrections: { [slotKey('금', 14)]: { kind: 'movable' } },
    })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })

    expect(schedule(state).perfectSlots).not.toContainEqual({ day: '금', hour: 14 })
  })

  it('탈출구2: 도윤의 응답 현황 행 클릭 → [불가] 수요일 오후 칩 삭제 → 응답 보내기 → 수14 완벽', () => {
    let state = postResponseState()

    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    const withoutUnavailable = doyun().response.chips.filter((c) => c.type !== '불가')

    // 삭제는 ParticipantPhoneFrame의 draftChips에만 반영된다 — 제출 전에는 재계산이 바뀌지 않는다(항목 6).
    const beforeSubmit = schedule(state)
    expect(beforeSubmit.perfectSlots).toEqual([])

    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: withoutUnavailable })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })

    expect(schedule(state).perfectSlots).toContainEqual({ day: '수', hour: 14 })
    expect(RAW_SEED.expected.escapes[1].result).toEqual({ day: '수', hour: 14, becomes: 'perfect' })
  })

  it('탈출구3: 서연의 응답 현황 행 클릭 → [회피] 13시 칩 삭제 → 응답 보내기 → 금13이 유일한 완벽 슬롯', () => {
    let state = postResponseState()

    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'seoyeon' })
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'seoyeon', chips: [] })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })

    const result = schedule(state)
    expect(result.perfectSlots).toEqual([{ day: '금', hour: 13 }])
    expect(RAW_SEED.expected.escapes[2].result).toEqual({ day: '금', hour: 13, becomes: 'perfect' })
  })

  it('세 탈출구 모두 원본 seed 데이터를 변경하지 않는다(정정은 계산 레이어에만 반영)', () => {
    let state = postResponseState()
    state = appReducer(state, {
      type: 'SUBMIT_RESPONSE',
      personId: 'haneul',
      chips: haneul().response.chips,
      corrections: { [slotKey('금', 14)]: { kind: 'empty' } },
    })
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'seoyeon', chips: [] })

    const haneulOriginal = RAW_SEED.people.find((p) => p.id === 'haneul')!
    const seoyeonOriginal = RAW_SEED.people.find((p) => p.id === 'seoyeon')!
    expect(haneulOriginal.calendar.some((e) => e.day === '금' && e.hours.includes(14))).toBe(true)
    expect(seoyeonOriginal.response.chips.length).toBeGreaterThan(0)

    // 커밋된 상태에서도 원본 캘린더는 불변이다(R5) — draftCorrections는 계산 레이어에만 반영된다.
    expect(state.people.find((p) => p.id === 'haneul')!.calendar).toEqual(haneulOriginal.calendar)
  })
})
