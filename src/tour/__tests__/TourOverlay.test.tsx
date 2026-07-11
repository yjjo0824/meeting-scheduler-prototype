import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { AppProvider } from '../../state/AppContext'
import { appReducer, buildInitialState } from '../../state/appReducer'
import { TourOverlay } from '../TourOverlay'

// react-dom/server(renderToStaticMarkup)는 useEffect를 실행하지 않는다 — 실제 브라우저에서는
// TourOverlay의 자동 전진 effect가 이 상태 변화를 감지해 SET_TOUR_STEP을 디스패치하지만,
// SSR에서는 그 effect가 돌지 않는다. 그래서 여기서는 "effect가 이미 실행된 이후의 상태"를
// SET_TOUR_STEP으로 직접 재현해 카드 렌더링만 검증한다 — effect가 정확한 시점에 도는지는
// tourSteps.test.ts(isComplete 조건)에서 이미 별도로 검증했다.
function render(initialState: ReturnType<typeof buildInitialState>): string {
  return renderToStaticMarkup(
    <AppProvider initialState={initialState}>
      <TourOverlay />
    </AppProvider>,
  )
}

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
}

describe('TourOverlay — 렌더링(단계별 카드 스냅샷)', () => {
  it('초기 상태: 1/4 카드, remind-button을 대상으로 하는 스타일 주입, 블로커 존재', () => {
    const html = render(buildInitialState())
    expect(html).toContain('1/4')
    expect(html).toContain('리마인드 보내기')
    expect(html).toContain('[data-tour-id="remind-button"]')
    expect(html).toContain('z-index: 900 !important')
  })

  it('비트2 상태(stepIndex=1): 폰 프레임 대상 카드가 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    state = appReducer(state, { type: 'SET_TOUR_STEP', stepIndex: 1 })
    const html = render(state)
    expect(html).toContain('2/4')
    expect(html).toContain('[data-tour-id="phone-frame"]')
  })

  it('비트3 상태(stepIndex=2): 트레이드오프 화면을 대상으로 하고 붕괴 원인 문구가 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })
    state = appReducer(state, { type: 'SET_TOUR_STEP', stepIndex: 2 })
    const html = render(state)
    expect(html).toContain('3/4')
    expect(html).toContain('[data-tour-id="tradeoff-screen"]')
    expect(html).toContain('캘린더에 없던 일정이 발견되어 추천 시간이 다시 계산됐어요')
  })

  it('마지막 카드(stepIndex=3): 자유 모드 해제 버튼을 대상으로 하고 지정된 마지막 문구가 정확히 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: 'k',
      slot: { day: '금', hour: 13 },
      excluded: [],
    })
    state = appReducer(state, { type: 'SET_TOUR_STEP', stepIndex: 3 })
    const html = render(state)
    expect(html).toContain('4/4')
    expect(html).toContain('[data-tour-id="unlock-free-mode-button"]')
    expect(html).toContain('조건을 바꿔보세요 — 후보가 실시간으로 다시 계산됩니다')
  })

  it('UNLOCK_FREE_MODE 이후에는 오버레이가 완전히 사라진다(잠금 해제, 리로드 없음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)
    expect(html).toBe('')
  })
})
