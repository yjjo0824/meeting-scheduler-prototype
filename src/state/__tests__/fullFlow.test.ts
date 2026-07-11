import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { appReducer, buildInitialState } from '../appReducer'
import { computeSchedule } from '../../engine/computeSchedule'
import { applyCalendarCorrections, deriveEffectivePeople } from '../useSchedule'
import { parseChips } from '../../parser/ruleBasedParser'

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
}

function schedule(state: ReturnType<typeof buildInitialState>) {
  const corrected = applyCalendarCorrections(state.people, state.calendarCorrections, RAW_SEED.grid)
  const effective = deriveEffectivePeople(corrected, state.hasResponded)
  return computeSchedule(RAW_SEED, effective)
}

// HostDashboard → ParticipantPhoneFrame → TradeoffCandidates → Confirmation을
// 실제 UI가 각 화면 클릭에서 디스패치하는 것과 동일한 액션 시퀀스로 재현한다.
// (jsdom/RTL 없이 상태 계층에서 클릭스루를 검증 — 각 화면의 렌더 스냅샷 테스트와 결합해
// "무엇이 보이는가"와 "클릭하면 무엇이 일어나는가"를 함께 커버한다.)
describe('전체 흐름: HostDashboard → PhoneFrame → TradeoffCandidates → Confirmation', () => {
  it('도윤 응답 → 재계산 붕괴 → 추천 후보군 확정까지 seed 수치를 끝까지 재현한다', () => {
    let state = buildInitialState()

    // 1) HostDashboard: 잠정 추천은 수 14시(응답 전 상태)
    expect(schedule(state).perfectSlots[0]).toEqual({ day: '수', hour: 14 })

    // 2) [리마인드 보내기] 클릭 → 폰 프레임 오픈
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    expect(state.phoneFrame).toEqual({ open: true, viewingPersonId: 'doyun' })

    // 3) 도윤 원문 입력 → 실제 컴포넌트가 호출하는 것과 동일한 파서 호출
    // type/day/hours만 비교한다 — cue는 화면 표시용 최선의 추정치일 뿐 seed와 바이트 일치를 요구하지 않는다(6단계 결정).
    const parsedChips = parseChips({ raw: doyun().response.raw!, calendarEvents: doyun().calendar, grid: RAW_SEED.grid })
    expect(parsedChips.map(({ type, day, hours }) => ({ type, day, hours }))).toEqual(
      doyun().response.chips.map(({ type, day, hours }) => ({ type, day, hours })),
    )

    // 4) [응답 보내기] 클릭
    state = appReducer(state, {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: parsedChips,
      raw: doyun().response.raw,
    })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })
    expect(state.phoneFrame.open).toBe(false)
    expect(state.hasResponded.doyun).toBe(true)

    // 5) 재계산: 완벽 슬롯 붕괴, 후보군 3개(seed.expected.candidate_groups_post) 등장
    const afterResponse = schedule(state)
    expect(afterResponse.perfectSlots).toEqual([])
    expect(afterResponse.groups.length).toBe(3)
    RAW_SEED.expected.candidate_groups_post.forEach((eg, i) => {
      expect(afterResponse.groups[i].excluded).toEqual(eg.excluded)
      expect(afterResponse.groups[i].cost).toBe(eg.cost)
    })

    // 6) TradeoffCandidates 화면으로 이동(App.tsx의 투어 자동 전환 효과가 하는 일과 동일)
    state = appReducer(state, { type: 'NAVIGATE', screen: 'tradeoff' })
    expect(state.screen).toBe('tradeoff')

    // 7) [이 시간으로 확정] 클릭 — 추천 후보군(금13, 제외 없음)을 확정
    const topGroup = afterResponse.groups[0]
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: topGroup.key,
      slot: topGroup.defaultSlot,
      excluded: topGroup.excluded,
    })

    // 8) Confirmation: 금요일 13시, 제외 없음, 화면 잠금
    expect(state.confirmedMeeting).toEqual({
      groupKey: topGroup.key,
      slot: { day: '금', hour: 13 },
      excluded: [],
    })
    expect(state.screen).toBe('confirmation')
  })

  it('다시 조율하기: confirmedMeeting을 해제하고 host로 돌아가되 응답 데이터는 보존한다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    const top = schedule(state).groups[0]
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: top.key,
      slot: top.defaultSlot,
      excluded: top.excluded,
    })

    state = appReducer(state, { type: 'REOPEN_FOR_RESCHEDULE' })

    expect(state.confirmedMeeting).toBeNull()
    expect(state.screen).toBe('host')
    // 조건 보존: 도윤의 응답은 그대로 남아 있다(전체 재수집이 아니라 재계산 한 번)
    expect(state.people.find((p) => p.id === 'doyun')!.response.chips).toEqual(doyun().response.chips)
    expect(state.hasResponded.doyun).toBe(true)
  })
})
