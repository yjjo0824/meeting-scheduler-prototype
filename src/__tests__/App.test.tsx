import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../data/loadSeed'
import App, { AppShell } from '../App'
import { AppProvider } from '../state/AppContext'
import { buildInitialState } from '../state/appReducer'

describe('App — 12A.8: MobileGuardNotice는 권장 배너일 뿐 제품 콘텐츠를 숨기지 않는다', () => {
  it('HostDashboard 콘텐츠가 hidden 계열 wrapper 없이 렌더된다(768px 미만 차단 해제)', () => {
    const html = renderToStaticMarkup(<App />)

    // 회의명(HostDashboard가 렌더링하는 seed 데이터)이 항상 출력된다 — 폭 조건으로 숨기는
    // wrapper(hidden md:contents 등)가 더 이상 없다.
    expect(html).toContain(RAW_SEED.meeting.title)
    expect(html).not.toContain('hidden md:contents')
  })
})

describe('App — 12B-1 QA 수정: 768px 미만에서 TourOverlay를 렌더링하지 않는다', () => {
  // 이 프로젝트의 Vitest 환경(environment: 'node')에는 window가 원래 없다 — 이미 진행 중이던
  // 데스크톱 투어가 좁은 화면에서 숨는지 보려면 AppShell 바깥에서 전역 window를 흉내내야 한다.
  function withStubbedWindow<T>(innerWidth: number, run: () => T): T {
    const original = (globalThis as { window?: unknown }).window
    ;(globalThis as { window?: unknown }).window = { innerWidth }
    try {
      return run()
    } finally {
      if (original === undefined) delete (globalThis as { window?: unknown }).window
      else (globalThis as { window?: unknown }).window = original
    }
  }

  // 데스크톱에서 이미 투어가 진행 중이던 상태를 그대로 주입한다(buildInitialState의 뷰포트
  // 판정과는 무관하게) — "이미 켜져 있던 투어가 좁은 화면에서 숨는가"만 독립적으로 검증하기 위함.
  function midTourState() {
    return { ...buildInitialState(), tour: { active: true, stepIndex: 0 } }
  }

  it('768px 이상에서는(기존과 동일하게) TourOverlay의 클릭 블로커가 렌더된다', () => {
    const html = withStubbedWindow(1280, () =>
      renderToStaticMarkup(
        <AppProvider initialState={midTourState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).toContain('z-[800]')
  })

  it('768px 미만에서는 진행 중이던 투어라도 TourOverlay가 렌더되지 않는다', () => {
    const html = withStubbedWindow(500, () =>
      renderToStaticMarkup(
        <AppProvider initialState={midTourState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).not.toContain('z-[800]')
  })

  it('상태 자체(tour.active/stepIndex)는 바뀌지 않는다 — 넓히면 그대로 복귀할 수 있다', () => {
    const state = midTourState()
    withStubbedWindow(500, () =>
      renderToStaticMarkup(
        <AppProvider initialState={state}>
          <AppShell />
        </AppProvider>,
      ),
    )
    // 렌더 자체가 state 객체를 변형하지 않는다(순수 조건부 렌더링일 뿐).
    expect(state.tour).toEqual({ active: true, stepIndex: 0 })
  })
})
