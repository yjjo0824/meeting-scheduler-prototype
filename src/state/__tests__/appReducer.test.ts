import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { appReducer, buildInitialState } from '../appReducer'
import { deriveEffectivePeople } from '../useSchedule'
import { computeSchedule } from '../../engine/computeSchedule'

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
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
