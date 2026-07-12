import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../data/loadSeed'
import App, { AppShell, shouldAutoNavigateToTradeoff } from '../App'
import { AppProvider } from '../state/AppContext'
import { appReducer, buildInitialState } from '../state/appReducer'

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

  it('768px 이상에서는(기존과 동일하게) TourOverlay의 단계 카드가 렌더된다', () => {
    const html = withStubbedWindow(1280, () =>
      renderToStaticMarkup(
        <AppProvider initialState={midTourState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).toContain('data-tour-card="true"')
  })

  it('768px 미만에서는 진행 중이던 투어라도 TourOverlay가 렌더되지 않는다', () => {
    const html = withStubbedWindow(500, () =>
      renderToStaticMarkup(
        <AppProvider initialState={midTourState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).not.toContain('data-tour-card')
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

  it('모바일 폭에서는(체험 도구는 잠금 해제된 채로) 투어 오버레이가 보이지 않는다', () => {
    const html = withStubbedWindow(500, () =>
      renderToStaticMarkup(
        <AppProvider initialState={afterMobileRoundTripState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).not.toContain('data-tour-card')
    expect(html).toContain('다른 역할 체험하기')
  })

  it('같은 상태에서 데스크톱 폭으로 되돌아오면 투어 카드가 다시 렌더된다', () => {
    const html = withStubbedWindow(1280, () =>
      renderToStaticMarkup(
        <AppProvider initialState={afterMobileRoundTripState()}>
          <AppShell />
        </AppProvider>,
      ),
    )
    expect(html).toContain('data-tour-card="true"')
    expect(html).toContain('2 / 4단계')
  })
})

describe('App — 12C-10: 우측 하단 스택(다시 보기 → 그 위 가이드/체험하기 자리 승계)', () => {
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

  function renderShell(state: ReturnType<typeof buildInitialState>) {
    return withStubbedWindow(1280, () =>
      renderToStaticMarkup(
        <AppProvider initialState={state}>
          <AppShell />
        </AppProvider>,
      ),
    )
  }

  it('투어 중: 다시 보기(bottom-4) 위(bottom-16 right-4)에 가이드 카드가 있고 체험하기는 없다', () => {
    const html = renderShell({ ...buildInitialState(), tour: { active: true, stepIndex: 0 } })
    expect(html).toContain('처음부터 다시 보기')
    // 가이드 카드가 bottom-16 right-4 자리를 차지한다.
    const cardIndex = html.indexOf('data-tour-card="true"')
    const cardTagStart = html.lastIndexOf('<div', cardIndex)
    const cardTagEnd = html.indexOf('>', cardIndex)
    const cardTag = html.slice(cardTagStart, cardTagEnd)
    expect(cardTag).toContain('bottom-16')
    expect(cardTag).toContain('right-4')
    expect(html).not.toContain('다른 역할 체험하기')
  })

  it('투어 종료(체험 시작하기/건너뛰기 = UNLOCK_FREE_MODE) 후: 가이드가 사라진 같은 자리(bottom-16 right-4)에 체험하기 pill이 나타난다', () => {
    const state = appReducer(buildInitialState(), { type: 'UNLOCK_FREE_MODE' })
    const html = renderShell(state)
    expect(html).not.toContain('data-tour-card')
    const pillIndex = html.indexOf('다른 역할 체험하기')
    const pillTagStart = html.lastIndexOf('<button', pillIndex)
    const pillTag = html.slice(pillTagStart, pillIndex)
    expect(pillTag).toContain('bottom-16')
    expect(pillTag).toContain('right-4')
    // 다시 보기는 그대로 맨 아래(bottom-4)에 남는다.
    expect(html).toContain('처음부터 다시 보기')
  })
})

describe('shouldAutoNavigateToTradeoff — 12C-5: 투어 자동 전환 판정(진행 버그 근본 원인 회귀 가드)', () => {
  function readyState() {
    // 도윤 제출 + 폰 프레임 닫힘 = 전원 응답, host 화면, 미확정 — 자동 전환이 발화해야 하는 상태.
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    state = appReducer(state, {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: RAW_SEED.people.find((p) => p.id === 'doyun')!.response.chips,
    })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })
    return state
  }

  it('도윤 제출 → 프레임 닫힘 시퀀스 후 전환 조건이 발화한다(정상 경로)', () => {
    expect(shouldAutoNavigateToTradeoff(readyState(), 3)).toBe(true)
  })

  it('버그 재현 조건: 모바일 진입으로 freeModeUnlocked=true가 된 뒤에도 투어가 활성이면 전환된다', () => {
    // 근본 원인: 이전 구현은 freeModeUnlocked를 "투어 진행 중"의 대리 조건으로 써서, 창이 한 번
    // 768px 아래로 내려갔다 돌아오면(UNLOCK_FREE_MODE keepTourActive:true) 이후 도윤 제출 시
    // 자동 전환이 영구히 발화하지 않았다. 판정은 tour.active 기준이어야 한다.
    let state = readyState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE', keepTourActive: true })
    expect(state.freeModeUnlocked).toBe(true)
    expect(state.tour.active).toBe(true)
    expect(shouldAutoNavigateToTradeoff(state, 3)).toBe(true)
  })

  it('투어가 끝났으면(Esc/건너뛰기/체험 시작) 자동 전환하지 않는다 — 사용자가 직접 이동한다', () => {
    let state = readyState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    expect(shouldAutoNavigateToTradeoff(state, 3)).toBe(false)
  })

  it('폰 프레임이 열려 있거나, 이미 확정됐거나, host 화면이 아니면 전환하지 않는다', () => {
    const base = readyState()
    expect(
      shouldAutoNavigateToTradeoff(appReducer(base, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' }), 3),
    ).toBe(false)
    expect(
      shouldAutoNavigateToTradeoff(
        appReducer(base, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] }),
        3,
      ),
    ).toBe(false)
    expect(shouldAutoNavigateToTradeoff({ ...base, screen: 'tradeoff' }, 3)).toBe(false)
  })

  it('미응답자가 남아 있거나 후보가 0개면 전환하지 않는다', () => {
    const initial = buildInitialState() // 도윤 미응답
    expect(shouldAutoNavigateToTradeoff(initial, 3)).toBe(false)
    expect(shouldAutoNavigateToTradeoff(readyState(), 0)).toBe(false)
  })
})
