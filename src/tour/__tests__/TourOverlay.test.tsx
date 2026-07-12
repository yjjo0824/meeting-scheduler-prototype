import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { AppProvider } from '../../state/AppContext'
import { appReducer, buildInitialState } from '../../state/appReducer'
import { TourOverlay } from '../TourOverlay'

// react-dom/server(renderToStaticMarkup)는 useEffect/useLayoutEffect를 실행하지 않는다 — 실제
// 브라우저에서는 TourOverlay의 자동 전진 effect가 이 상태 변화를 감지해 SET_TOUR_STEP을
// 디스패치하고, TourStepCard가 대상과 겹치지 않는 위치를 계산한다. SSR에서는 그 effect들이
// 돌지 않으므로, 여기서는 "effect가 이미 실행된 이후의 상태"를 SET_TOUR_STEP으로 직접 재현해
// 카드 내용·구조만 검증한다 — 진행 조건은 tourSteps.test.ts, 위치 계산은 chooseCardPosition을
// 직접 호출하는 순수 함수 테스트(TourStepCard.test.ts)에서 각각 검증한다.
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

describe('TourOverlay — 렌더링(단계별 카드 스냅샷, 12B-2 새 카피)', () => {
  it('초기 상태: 1 / 4단계 카드, remind-button을 대상으로 하는 스타일 주입, 블로커 존재', () => {
    const html = render(buildInitialState())
    expect(html).toContain('1 / 4단계')
    expect(html).toContain('아직 한 명이 답하지 않았어요')
    expect(html).toContain('[data-tour-id="remind-button"]')
    expect(html).toContain('z-index: 900 !important')
  })

  it('스타일 주입은 position을 강제하지 않는다(phone-frame의 fixed 배치를 깨뜨리지 않기 위함)', () => {
    const html = render(buildInitialState())
    expect(html).not.toContain('position: relative')
  })

  it('카드는 region 역할과 제목·본문에 연결된 aria-labelledby/aria-describedby를 갖는다', () => {
    const html = render(buildInitialState())
    expect(html).toContain('role="region"')
    expect(html).toContain('aria-labelledby="tour-step-title"')
    expect(html).toContain('aria-describedby="tour-step-body"')
    expect(html).toContain('data-tour-card="true"')
  })

  it('내부 용어("자유 모드", "트레이드오프", "직접 사용해보세요")는 어떤 단계 카피에도 없다', () => {
    for (const state of [
      buildInitialState(),
      appReducer(
        appReducer(buildInitialState(), { type: 'OPEN_PHONE_FRAME', personId: 'doyun' }),
        { type: 'SET_TOUR_STEP', stepIndex: 1 },
      ),
    ]) {
      const html = render(state)
      expect(html).not.toContain('자유 모드')
      expect(html).not.toContain('트레이드오프')
      expect(html).not.toContain('직접 사용해보세요')
    }
  })

  it('비트2 상태(stepIndex=1): 폰 프레임 전체를 대상으로 하고, 예시 문장 채우기 버튼이 있다(12B-3: 입력 영역만 좁게 잡지 않음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    state = appReducer(state, { type: 'SET_TOUR_STEP', stepIndex: 1 })
    const html = render(state)
    expect(html).toContain('2 / 4단계')
    expect(html).toContain('[data-tour-id="phone-frame"]')
    expect(html).not.toContain('phone-core-input')
    expect(html).toContain('예시 문장 채우기')
    expect(html).toContain(doyun().response.raw!)
  })

  it('비트3 상태(stepIndex=2): 트레이드오프 화면을 대상으로 하고 추천 변경 문구가 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun().response.chips })
    state = appReducer(state, { type: 'CLOSE_PHONE_FRAME' })
    state = appReducer(state, { type: 'SET_TOUR_STEP', stepIndex: 2 })
    const html = render(state)
    expect(html).toContain('3 / 4단계')
    expect(html).toContain('[data-tour-id="tradeoff-screen"]')
    expect(html).toContain('새 조건 때문에 추천이 달라졌어요')
  })

  it('마지막 카드(stepIndex=3): 확정 결과 요약을 대상으로 하고 [체험 시작하기] CTA가 카드 안에 있다', () => {
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
    expect(html).toContain('4 / 4단계')
    expect(html).toContain('[data-tour-id="confirmation-summary"]')
    expect(html).toContain('이제 직접 바꿔볼 수 있어요')
    expect(html).toContain('체험 시작하기')
  })

  it('UNLOCK_FREE_MODE 이후에는 오버레이가 완전히 사라진다(잠금 해제, 리로드 없음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)
    expect(html).toBe('')
  })
})
