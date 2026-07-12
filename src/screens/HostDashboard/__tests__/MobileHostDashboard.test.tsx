import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { AppProvider } from '../../../state/AppContext'
import { buildInitialState } from '../../../state/appReducer'
import { MobileHostDashboard } from '../MobileHostDashboard'

function render(stateOverride?: Partial<ReturnType<typeof buildInitialState>>) {
  const initialState = { ...buildInitialState(), ...stateOverride }
  return renderToStaticMarkup(
    <AppProvider initialState={initialState}>
      <MobileHostDashboard selectedPersonId={null} onSelectPerson={() => {}} />
    </AppProvider>,
  )
}

// MobileHostDashboard의 view 상태(list/detail/days)는 컴포넌트 내부 useState라 SSR로는
// 기본값(list)만 직접 검증할 수 있다. detail/days 화면의 실제 내용은 각각 재사용하는
// PersonDetailPanel(기존 테스트로 검증됨)과 MobileDayTabs·MobileDayCompareGrid(별도 테스트로
// 검증됨)가 이미 커버한다 — 여기서는 첫 화면(list)과 상태 기반 CTA 분기만 확인한다.
describe('MobileHostDashboard — 좁은 화면 첫 화면(list)', () => {
  it('회의명·응답 현황·리마인드·잠정 추천·참여자 목록·요일별 비교 진입이 모두 표시된다', () => {
    const html = render()
    expect(html).toContain(RAW_SEED.meeting.title)
    expect(html).toContain('도윤 님의 답변을 기다리고 있어요')
    expect(html).toContain('data-tour-id="remind-button"')
    expect(html).toContain('현재 가장 좋은 시간이에요')
    expect(html).toContain('참여자 (6)')
    expect(html).toContain('요일별 시간 보기')
  })

  it('실제 제품 화면에는 참여자 응답 화면(폰 프레임) 진입 CTA가 없다(항목 4)', () => {
    const html = render()
    expect(html).not.toContain('참여자 화면 보기')
    expect(html).not.toContain('평가용 기능이에요')
    expect(html).not.toContain('참여자로 체험하기')
  })

  it('도윤의 원문·사유(cue)는 어디에도 노출되지 않는다(R4)', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const html = render()
    expect(html).not.toContain(doyun.response.raw!)
    for (const chip of doyun.response.chips) {
      if (chip.cue) expect(html).not.toContain(chip.cue)
    }
  })
})

describe('MobileHostDashboard — 상태 기반 결과 CTA(기존 NAVIGATE 액션 재사용)', () => {
  it('확정 전에는 "후보 시간 비교하기"만 보이고 "확정 결과 보기"는 없다', () => {
    const html = render()
    expect(html).toContain('후보 시간 비교하기')
    expect(html).not.toContain('확정 결과 보기')
  })

  it('확정 후에는 "확정 결과 보기"만 보이고 "후보 시간 비교하기"는 없다', () => {
    const html = render({
      confirmedMeeting: { groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] },
    })
    expect(html).toContain('확정 결과 보기')
    expect(html).not.toContain('후보 시간 비교하기')
  })
})

describe('MobileHostDashboard — 미응답자가 없으면 리마인드 카드가 사라진다', () => {
  it('전원 응답 완료 상태에서는 리마인드 카드가 렌더되지 않는다', () => {
    const state = buildInitialState()
    const allResponded = Object.fromEntries(RAW_SEED.people.map((p) => [p.id, true]))
    const html = render({ hasResponded: allResponded, people: state.people })
    expect(html).not.toContain('님의 답변을 기다리고 있어요')
  })
})
