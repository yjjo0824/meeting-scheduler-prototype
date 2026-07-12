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

describe('HostDashboard — 참석 어려움 신고 알림(12B QA 항목 3)', () => {
  function renderWith(state: ReturnType<typeof buildInitialState>): string {
    return renderToStaticMarkup(
      <AppProvider initialState={state}>
        <HostDashboard />
      </AppProvider>,
    )
  }

  function confirmedState() {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: [] })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] })
    return state
  }

  it('확정 후 서연이 신고하면 이름이 파생된 알림과 확정 결과 진입 CTA가 보인다', () => {
    let state = confirmedState()
    state = appReducer(state, { type: 'REPORT_UNAVAILABLE', personId: 'seoyeon' })
    const html = renderWith(state)

    expect(html).toContain('서연 님이 확정된 시간에 참석하기 어렵다고 알려왔어요')
    expect(html).toContain('다시 조율할지는 주최자가 결정할 수 있어요.')
    expect(html).toContain('확정 결과 확인하기')
  })

  it('신고가 여러 명이면 이름이 모두 나열된다(상태에서 파생)', () => {
    let state = confirmedState()
    state = appReducer(state, { type: 'REPORT_UNAVAILABLE', personId: 'seoyeon' })
    state = appReducer(state, { type: 'REPORT_UNAVAILABLE', personId: 'minjun' })
    const html = renderWith(state)

    expect(html).toContain('민준 님, 서연 님이 확정된 시간에 참석하기 어렵다고 알려왔어요')
  })

  it('신고가 없으면 알림이 보이지 않는다', () => {
    const html = renderWith(confirmedState())
    expect(html).not.toContain('참석하기 어렵다고 알려왔어요')
  })

  it('다시 조율하기로 확정이 풀리면 알림 대신 재조율 흐름이 이어받는다(알림 비노출)', () => {
    let state = confirmedState()
    state = appReducer(state, { type: 'REPORT_UNAVAILABLE', personId: 'seoyeon' })
    state = appReducer(state, { type: 'REOPEN_FOR_RESCHEDULE' })
    const html = renderWith(state)
    expect(html).not.toContain('참석하기 어렵다고 알려왔어요')
    expect(html).not.toContain('참석 어려움 알림')
  })

  it('신고한 참여자의 조건 지도 행에 "참석 어려움 알림" 배지가 붙는다(다른 사람 행에는 없음)', () => {
    let state = confirmedState()
    state = appReducer(state, { type: 'REPORT_UNAVAILABLE', personId: 'seoyeon' })
    const html = renderWith(state)

    // 상단 ReportNoticeCard에도 '서연'이 등장하므로, 조건 지도(표) 구간 안에서만 행을 찾는다.
    const mapStart = html.indexOf('모두의 시간 조건')
    const seoyeonRowStart = html.indexOf('서연', mapStart)
    const seoyeonRowEnd = html.indexOf('</tr>', seoyeonRowStart)
    expect(html.slice(seoyeonRowStart, seoyeonRowEnd)).toContain('참석 어려움 알림')

    const minjunRowStart = html.indexOf('민준', mapStart)
    const minjunRowEnd = html.indexOf('</tr>', minjunRowStart)
    expect(html.slice(minjunRowStart, minjunRowEnd)).not.toContain('참석 어려움 알림')
  })
})
