import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppProvider } from '../../../state/AppContext'
import { appReducer, buildInitialState } from '../../../state/appReducer'
import { RAW_SEED } from '../../../data/loadSeed'
import { HostDashboard } from '../HostDashboard'

// react-dom/server만으로 정적 HTML을 렌더링해 필수 표시 문구를 검증한다.
// jsdom·RTL·브라우저 자동화 없이도 "필수 요소가 실제로 그려지는가"를 자동으로 확인할 수 있다.
function renderHostDashboard(): string {
  return renderToStaticMarkup(
    <AppProvider>
      <HostDashboard />
    </AppProvider>,
  )
}

describe('HostDashboard — IMPLEMENTATION_SPEC §4.2 필수 표시(조건 지도 구조)', () => {
  const html = renderHostDashboard()

  it('회의명이 표시된다', () => {
    expect(html).toContain(RAW_SEED.meeting.title)
  })

  it('범위·소요시간·응답 기한이 seed 데이터로부터 표시된다(하드코딩 아님)', () => {
    expect(html).toContain(RAW_SEED.meeting.window)
    expect(html).toContain(`${RAW_SEED.meeting.duration_hours}시간`)
    expect(html).toContain(RAW_SEED.meeting.response_deadline)
  })

  it('응답 현황(5명이 답변했어요)이 표시된다(투어 시작 상태)', () => {
    expect(html).toContain('5명이 답변했어요')
  })

  it('도윤/마케터/선택/답변 전이 조건 지도에 표시된다', () => {
    expect(html).toContain('도윤')
    expect(html).toContain('마케터')
    expect(html).toContain('선택')
    expect(html).toContain('답변 전')
  })

  it('미응답 상태(리마인드) 카드와 잠정 추천 카드가 분리되어 표시된다', () => {
    expect(html).toContain('도윤 님의 답변을 기다리고 있어요')
    expect(html).toContain('잠정 추천')
    expect(html).toContain('현재 가장 좋은 시간이에요')
    expect(html).toContain('수요일 오후 2시')
    expect(html).toContain('도윤 님의 캘린더 일정만 반영했어요.')
  })

  it('리마인드 보내기 버튼이 표시된다', () => {
    expect(html).toContain('리마인드 보내기')
    expect(html).toContain('data-tour-id="remind-button"')
  })

  it('도윤의 응답 원문·사유(cue)는 어디에도 노출되지 않는다(R4)', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    expect(html).not.toContain(doyun.response.raw!)
    for (const chip of doyun.response.chips) {
      if (chip.cue) expect(html).not.toContain(chip.cue)
    }
  })

  it('아무 참여자도 선택하지 않은 기본 상태에서는 상세 패널의 "참여자 화면 보기" 버튼이 보이지 않는다(행 클릭이 곧바로 화면 전환을 일으키지 않음)', () => {
    expect(html).not.toContain('참여자 화면 보기')
    expect(html).toContain('참여자를 선택하면 조건 상세가 여기 보여요')
  })

  it('조건 지도의 범례가 표시된다', () => {
    expect(html).toContain('모두의 시간 조건')
    expect(html).toContain('참석 어려움')
    expect(html).toContain('가급적 피함')
    expect(html).toContain('옮길 수 있음')
  })
})

describe('HostDashboard — 전원 응답 후 추천 카드가 실제 제품 흐름의 후보 진입점이 된다(12B)', () => {
  function renderWith(state: ReturnType<typeof buildInitialState>): string {
    return renderToStaticMarkup(
      <AppProvider initialState={state}>
        <HostDashboard />
      </AppProvider>,
    )
  }

  it('완벽 슬롯이 없으면: 6명 모두 답변 배지 + 후보 n개 제목 + [후보 시간 비교하기] CTA', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const state = appReducer(buildInitialState(), {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: doyun.response.chips,
    })
    const html = renderWith(state)

    expect(html).toContain('6명 모두 답변')
    // 후보 수는 현재 후보군 계산 결과에서 파생된다(도윤 응답 후 = 3개).
    expect(html).toContain('조건이 다른 후보 3개를 찾았어요')
    expect(html).toContain('참석 인원과 원하는 시간을 비교해 결정해보세요.')
    expect(html).toContain('후보 시간 비교하기')
    // 리마인드 카드는 사라진다(미응답자 없음).
    expect(html).not.toContain('답변을 기다리고 있어요')
  })

  it('완벽 슬롯이 생기면: 모두 괜찮은 시간이 있어요 + 추천 시간 + [이 시간 확인하기] CTA', () => {
    // 도윤이 조건 없이(빈 칩) 응답하면 수14~17 완벽 슬롯이 유지된다.
    const state = appReducer(buildInitialState(), { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: [] })
    const html = renderWith(state)

    expect(html).toContain('모두 괜찮은 시간이 있어요')
    expect(html).toContain('수요일 오후 2시')
    expect(html).toContain('이 시간 확인하기')
    expect(html).not.toContain('후보 시간 비교하기')
  })
})
