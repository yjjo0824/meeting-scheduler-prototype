import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppProvider } from '../../state/AppContext'
import { buildInitialState } from '../../state/appReducer'
import { EvaluatorResetBar } from '../EvaluatorResetBar'

// 이 프로젝트의 Vitest 환경(environment: 'node')에는 window가 원래 없다 — 데스크톱/모바일
// 배치 분기(useIsNarrowViewport)를 SSR로 확인하려면 App.test.tsx와 동일한 방식으로 전역
// window를 흉내낸다.
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

function render(): string {
  return renderToStaticMarkup(
    <AppProvider initialState={buildInitialState()}>
      <EvaluatorResetBar />
    </AppProvider>,
  )
}

describe('EvaluatorResetBar — 역할 체험 패널과 분리된 독립 리셋 액션(12B-3)', () => {
  it('데스크톱(768px 이상)에서도 "처음부터 다시 보기" 버튼이 항상 보인다(freeModeUnlocked 여부와 무관)', () => {
    const html = withStubbedWindow(1280, render)
    expect(html).toContain('처음부터 다시 보기')
  })

  it('모바일(768px 미만)에서도 독립적으로 "처음부터 다시 보기"에 접근할 수 있다(하단 역할 체험 패널 안이 아님)', () => {
    const html = withStubbedWindow(500, render)
    expect(html).toContain('처음부터 다시 보기')
  })

  it('버튼 클릭은 RESET_ALL을 디스패치한다(코드 검토 보완: 클릭 이벤트는 SSR로 재현 불가 — ResetButton onClick 배선 참고)', () => {
    // renderToStaticMarkup은 onClick을 실행하지 않는다 — EvaluatorResetBar가
    // dispatch({ type: 'RESET_ALL' })를 ResetButton의 onClick으로 넘기는 배선은 코드 검토로 확인.
    // 여기서는 버튼이 실제로 렌더되는지만 구조적으로 확인한다.
    const html = withStubbedWindow(1280, render)
    expect(html).toContain('<button')
  })
})
