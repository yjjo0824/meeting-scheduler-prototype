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

describe('App — 12B-2: 모바일에서도 체험 도구를 쓸 수 있어야 한다(투어 없이)', () => {
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

  // useMobileExperienceUnlock은 마운트 시 dispatch(UNLOCK_FREE_MODE)하는 useEffect라 SSR
  // 단일 렌더로는 "언제 발동하는가"를 직접 재현할 수 없다(프로젝트 공통 한계). 대신 그 결과
  // 상태(freeModeUnlocked=true)를 좁은 화면에 주입해, 배선(체험 도구가 모바일에서도 실제로
  // 나타나는지)이 올바른지 확인한다 — 발동 조건(isNarrow && !freeModeUnlocked) 자체는 코드
  // 검토로 확인했다(App.tsx의 useMobileExperienceUnlock).
  it('좁은 화면 + freeModeUnlocked=true 상태에서 체험 도구 진입 버튼이 보인다', () => {
    const state = { ...buildInitialState(), tour: { active: false, stepIndex: 0 }, freeModeUnlocked: true }
    const html = withStubbedWindow(500, () => renderToStaticMarkup(<AppProvider initialState={state}><AppShell /></AppProvider>))
    expect(html).toContain('다른 역할 체험하기')
  })

  it('좁은 화면에서 freeModeUnlocked=false면(아직 마운트 effect 전) 체험 도구가 보이지 않는다', () => {
    const state = { ...buildInitialState(), tour: { active: false, stepIndex: 0 }, freeModeUnlocked: false }
    const html = withStubbedWindow(500, () => renderToStaticMarkup(<AppProvider initialState={state}><AppShell /></AppProvider>))
    expect(html).not.toContain('다른 역할 체험하기')
  })
})

describe('App — 12B-3: 데스크톱↔모바일 전환 후에도 투어 dim이 정상 복구된다', () => {
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

  // 모바일 진입(useMobileExperienceUnlock)이 UNLOCK_FREE_MODE에 keepTourActive:true를 넘겨
  // tour.active를 건드리지 않는다(App.tsx, appReducer.ts) — 그 결과 상태를 그대로 주입해
  // "이미 모바일을 한 번 거쳐온" 상황을 재현한다. 실제 리사이즈 이벤트 자체는 SSR로 재현할 수
  // 없는 프로젝트 공통 한계이므로, 여기서는 "그 상태에서 좁은 화면이면 숨고 넓은 화면이면
  // 다시 보인다"는 배선을 구조적으로 검증한다(발동 조건 자체는 appReducer.test.ts에서 검증).
  function afterMobileRoundTripState() {
    return { ...buildInitialState(), tour: { active: true, stepIndex: 1 }, freeModeUnlocked: true }
  }

  it('모바일 폭에서는(체험 도구는 잠금 해제된 채로) 투어 dim이 보이지 않는다', () => {
    const html = withStubbedWindow(500, () =>
      renderToStaticMarkup(
        <AppProvider initialState={afterMobileRoundTripState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).not.toContain('z-[800]')
    expect(html).toContain('다른 역할 체험하기')
  })

  it('같은 상태에서 데스크톱 폭으로 되돌아오면 투어 dim(클릭 블로커)이 다시 렌더된다', () => {
    const html = withStubbedWindow(1280, () =>
      renderToStaticMarkup(
        <AppProvider initialState={afterMobileRoundTripState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).toContain('z-[800]')
    expect(html).toContain('2 / 4단계')
  })
})
