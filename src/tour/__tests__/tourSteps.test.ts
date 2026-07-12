import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { appReducer, buildInitialState } from '../../state/appReducer'
import { TOUR_STEPS } from '../tourSteps'

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
}

// SPEC §5의 3비트 스크립트와 정확히 같은 액션 시퀀스를 따라가며, 각 단계 경계에서
// 그 단계만 isComplete=true가 되고 다른 단계는 false로 남는지 확인한다.
describe('TOUR_STEPS — 3비트 진행 조건이 실제 액션 시퀀스와 정확히 맞물린다', () => {
  it('초기 상태에서는 어떤 단계도 완료되지 않았다', () => {
    const state = buildInitialState()
    for (const step of TOUR_STEPS) {
      expect(step.isComplete(state)).toBe(false)
    }
  })

  it('비트1 완료: [리마인드 보내기] 클릭(OPEN_PHONE_FRAME) 이후 host 단계만 완료된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })

    expect(TOUR_STEPS[0].isComplete(state)).toBe(true)
    expect(TOUR_STEPS[1].isComplete(state)).toBe(false)
    expect(TOUR_STEPS[2].isComplete(state)).toBe(false)
    expect(TOUR_STEPS[3].isComplete(state)).toBe(false)
  })

  it('비트2 완료: 응답 제출 + 폰 프레임 닫힘 이후 phone 단계가 완료된다(host는 이미 지난 조건)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })

    expect(TOUR_STEPS[1].isComplete(state)).toBe(true)
    expect(TOUR_STEPS[2].isComplete(state)).toBe(false)
    expect(TOUR_STEPS[3].isComplete(state)).toBe(false)
  })

  it('제출만 하고 프레임을 닫지 않으면 phone 단계는 아직 완료되지 않는다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })

    expect(TOUR_STEPS[1].isComplete(state)).toBe(false)
  })

  it('비트3 완료: 후보군 확정(CONFIRM_MEETING) 이후 tradeoff 단계가 완료된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: 'k',
      slot: { day: '금', hour: 13 },
      excluded: [],
    })

    expect(TOUR_STEPS[2].isComplete(state)).toBe(true)
    expect(TOUR_STEPS[3].isComplete(state)).toBe(false)
  })

  it('마지막 단계 완료: UNLOCK_FREE_MODE 이후 confirmation 단계가 완료되고 투어는 종료된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })

    expect(TOUR_STEPS[3].isComplete(state)).toBe(true)
    expect(state.tour.active).toBe(false)
  })

  it('마지막 카드 문구는 12B-2 지정 문구와 정확히 일치하고, CTA가 체험 시작하기다', () => {
    expect(TOUR_STEPS[3].title).toBe('이제 직접 바꿔볼 수 있어요')
    expect(TOUR_STEPS[3].body).toBe('조건을 바꾸면 후보가 바로 다시 계산돼요.')
    expect(TOUR_STEPS[3].ctaLabel).toBe('체험 시작하기')
  })

  it('비트3 카드 문구는 새 조건 때문에 추천이 달라졌음을 명시한다', () => {
    expect(TOUR_STEPS[2].title).toBe('새 조건 때문에 추천이 달라졌어요')
    expect(TOUR_STEPS[2].body).toContain('모두 참석하는 안과 원하는 시간을 지키는 안을 비교')
  })

  it('1~3단계에는 ctaLabel이 없다(진짜 사용자 행동으로 진행되는 기존 방식 유지, 가짜 다음 버튼 없음)', () => {
    expect(TOUR_STEPS[0].ctaLabel).toBeUndefined()
    expect(TOUR_STEPS[1].ctaLabel).toBeUndefined()
    expect(TOUR_STEPS[2].ctaLabel).toBeUndefined()
  })

  it('2단계 대상은 폰 프레임 전체가 아니라 핵심 입력 영역이다', () => {
    expect(TOUR_STEPS[1].targetId).toBe('phone-core-input')
  })

  it('4단계 대상은 더 이상 제품 본문의 버튼이 아니라 확정 결과 요약 영역이다', () => {
    expect(TOUR_STEPS[3].targetId).toBe('confirmation-summary')
  })
})
