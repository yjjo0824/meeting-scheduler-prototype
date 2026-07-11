import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { appReducer, buildInitialState } from '../appReducer'
import { applyCalendarCorrections, deriveEffectivePeople } from '../useSchedule'
import { computeSchedule } from '../../engine/computeSchedule'

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
}

function seoyeon() {
  return RAW_SEED.people.find((p) => p.id === 'seoyeon')!
}

describe('buildInitialState — hasResponded 초기화 규칙', () => {
  it('responded_at_demo_start !== false 규칙: 필드 없는 사람은 응답 완료, 도윤만 미응답', () => {
    const state = buildInitialState()
    expect(state.hasResponded).toEqual({
      jiwon: true,
      minjun: true,
      seoyeon: true,
      haneul: true,
      doyun: false,
      sua: true,
    })
  })

  it('people은 RAW_SEED와 별개의 deep clone이다', () => {
    const state = buildInitialState()
    expect(state.people).toEqual(RAW_SEED.people)
    expect(state.people).not.toBe(RAW_SEED.people)
    state.people[0].calendar.push({ title: '테스트', day: '월', hours: [9] })
    expect(RAW_SEED.people[0].calendar).not.toEqual(state.people[0].calendar)
  })

  it('투어는 활성 상태·0단계로 시작하고, 확정·자유모드는 잠겨있다', () => {
    const state = buildInitialState()
    expect(state.tour).toEqual({ active: true, stepIndex: 0 })
    expect(state.confirmedMeeting).toBeNull()
    expect(state.freeModeUnlocked).toBe(false)
    expect(state.screen).toBe('host')
  })
})

describe('appReducer — SUBMIT_RESPONSE가 파생 후보를 실시간으로 바꾼다', () => {
  it('도윤 응답 전: 잠정 완벽 슬롯 = 수14~17 (deriveEffectivePeople을 거친 computeSchedule 기준)', () => {
    const state = buildInitialState()
    const effective = deriveEffectivePeople(state.people, state.hasResponded)
    const before = computeSchedule(RAW_SEED, effective)

    expect(before.perfectSlots).toEqual(
      RAW_SEED.expected.pre_doyun_tentative_perfect.map((s) => ({ day: s.day, hour: s.hour })),
    )
  })

  it('SUBMIT_RESPONSE(도윤) 디스패치 후: 완벽 슬롯이 사라지고 후보군 3개로 붕괴한다', () => {
    const before = buildInitialState()
    const after = appReducer(before, {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: doyun().response.chips,
      raw: doyun().response.raw,
    })

    expect(after.hasResponded.doyun).toBe(true)
    expect(after.people.find((p) => p.id === 'doyun')!.response.chips).toEqual(doyun().response.chips)

    const effective = deriveEffectivePeople(after.people, after.hasResponded)
    const result = computeSchedule(RAW_SEED, effective)

    expect(result.perfectSlots).toEqual([])
    expect(result.groups.length).toBe(RAW_SEED.expected.candidate_groups_post.length)
    RAW_SEED.expected.candidate_groups_post.forEach((eg, i) => {
      expect(result.groups[i].excluded).toEqual(eg.excluded)
      expect(result.groups[i].cost).toBe(eg.cost)
    })
  })
})

describe('appReducer — 화면 전환·확정·자유모드·리셋', () => {
  it('CONFIRM_MEETING은 confirmedMeeting을 채우고 confirmation 화면으로 전환한다', () => {
    const state = buildInitialState()
    const slot = { day: '금' as const, hour: 13 }
    const after = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: '|seoyeon', slot })

    expect(after.confirmedMeeting).toEqual({ groupKey: '|seoyeon', slot })
    expect(after.screen).toBe('confirmation')
  })

  it('UNLOCK_FREE_MODE는 자유모드를 열고 투어를 종료한다', () => {
    const state = buildInitialState()
    const after = appReducer(state, { type: 'UNLOCK_FREE_MODE' })

    expect(after.freeModeUnlocked).toBe(true)
    expect(after.tour.active).toBe(false)
  })

  it('RESET_ALL은 어떤 상태에서든 buildInitialState()와 동등한 상태로 되돌린다', () => {
    let state = buildInitialState()
    state = appReducer(state, {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: doyun().response.chips,
    })
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'x', slot: { day: '금', hour: 13 } })

    const resetState = appReducer(state, { type: 'RESET_ALL' })
    expect(resetState).toEqual(buildInitialState())
  })
})

describe('appReducer — 탈출구 1: 캘린더 정정(옮길 수 있어요) → 금14 완벽 슬롯', () => {
  it('APPLY_CALENDAR_CORRECTION(하늘, 금14, movable) 이후 금14가 완벽 슬롯이 된다', () => {
    let state = buildInitialState()
    // 응답 후 상태를 만든다(도윤 응답 완료) — 탈출구는 응답 후 시나리오 기준
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, {
      type: 'APPLY_CALENDAR_CORRECTION',
      personId: 'haneul',
      day: '금',
      hour: 14,
      kind: 'movable',
    })

    const corrected = applyCalendarCorrections(state.people, state.calendarCorrections, RAW_SEED.grid)
    const effective = deriveEffectivePeople(corrected, state.hasResponded)
    const result = computeSchedule(RAW_SEED, effective)

    expect(result.perfectSlots).toContainEqual({ day: '금', hour: 14 })
  })

  it('UNDO_CALENDAR_CORRECTION 이후에는 다시 하드 제약으로 복귀한다(원본 캘린더 불변 확인)', () => {
    let state = buildInitialState()
    state = appReducer(state, {
      type: 'APPLY_CALENDAR_CORRECTION',
      personId: 'haneul',
      day: '금',
      hour: 14,
      kind: 'movable',
    })
    state = appReducer(state, { type: 'UNDO_CALENDAR_CORRECTION', personId: 'haneul', day: '금', hour: 14 })

    expect(state.calendarCorrections.haneul?.['금#14']).toBeUndefined()
    const haneulOriginal = RAW_SEED.people.find((p) => p.id === 'haneul')!
    const haneulAfter = state.people.find((p) => p.id === 'haneul')!
    expect(haneulAfter.calendar).toEqual(haneulOriginal.calendar)
  })
})

describe('appReducer — 탈출구 2/3: 칩 삭제 → 완벽 슬롯 등장', () => {
  it('UPDATE_CHIPS로 도윤의 수요일 오후 불가 칩을 지우면 수14가 완벽 슬롯이 된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })

    const doyunChipsWithoutUnavailable = doyun().response.chips.filter((c) => c.type !== '불가')
    state = appReducer(state, { type: 'UPDATE_CHIPS', personId: 'doyun', chips: doyunChipsWithoutUnavailable })

    const effective = deriveEffectivePeople(state.people, state.hasResponded)
    const result = computeSchedule(RAW_SEED, effective)
    expect(result.perfectSlots).toContainEqual({ day: '수', hour: 14 })
  })

  it('UPDATE_CHIPS로 서연의 13시 회피 칩을 지우면 금13이 유일한 완벽 슬롯이 된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'UPDATE_CHIPS', personId: 'seoyeon', chips: [] })

    expect(state.people.find((p) => p.id === 'seoyeon')!.response.chips).toEqual([])
    // seoyeon()의 원본 seed 응답은 변하지 않는다(원본 불변)
    expect(seoyeon().response.chips.length).toBeGreaterThan(0)

    const effective = deriveEffectivePeople(state.people, state.hasResponded)
    const result = computeSchedule(RAW_SEED, effective)
    expect(result.perfectSlots).toEqual([{ day: '금', hour: 13 }])
  })
})

describe('appReducer — 참석자 필수/선택 변경', () => {
  it('SET_ATTENDANCE는 즉시 재계산에 반영된다(도윤을 필수로 바꾸면 도윤 제외 후보군이 사라진다)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'SET_ATTENDANCE', personId: 'doyun', attendance: 'required' })

    expect(state.people.find((p) => p.id === 'doyun')!.attendance).toBe('required')

    const effective = deriveEffectivePeople(state.people, state.hasResponded)
    const result = computeSchedule(RAW_SEED, effective)
    // 도윤이 필수가 되면 도윤의 불가(수 14~17)가 required 그룹을 막아 그 슬롯들은 후보에서 사라진다
    expect(result.groups.some((g) => g.excluded.includes('doyun'))).toBe(false)
  })
})

describe('appReducer — 미응답 신고', () => {
  it('REPORT_UNAVAILABLE은 해당 참여자의 신고 플래그만 세운다(상세 플로우 없음)', () => {
    const state = buildInitialState()
    const after = appReducer(state, { type: 'REPORT_UNAVAILABLE', personId: 'seoyeon' })
    expect(after.reportedByPersonId.seoyeon).toBe(true)
    expect(after.confirmedMeeting).toBe(state.confirmedMeeting)
  })
})
