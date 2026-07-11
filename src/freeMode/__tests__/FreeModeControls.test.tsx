import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppProvider } from '../../state/AppContext'
import { appReducer, buildInitialState } from '../../state/appReducer'
import { FreeModeControls } from '../FreeModeControls'

function render(initialState: ReturnType<typeof buildInitialState>): string {
  return renderToStaticMarkup(
    <AppProvider initialState={initialState}>
      <FreeModeControls />
    </AppProvider>,
  )
}

describe('FreeModeControls — 화면 이동 전용(필수/선택 변경은 HostDashboard로 이동함)', () => {
  it('자유 모드 해제 전에는 아무것도 렌더링하지 않는다', () => {
    const html = render(buildInitialState())
    expect(html).toBe('')
  })

  it('자유 모드 해제 후에는 리셋 버튼과 화면 이동 버튼만 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).toContain('처음부터 다시 보기')
    expect(html).toContain('주최자 화면')
    expect(html).toContain('트레이드오프')
  })

  it('필수/선택 변경 컨트롤은 더 이상 여기 없다(HostDashboard의 PersonDetailPanel로 이동)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)
    expect(html).not.toContain('참석자 필수/선택 변경')
  })

  it('확정된 회의가 없으면 "확정 결과" 이동 버튼은 보이지 않는다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)
    expect(html).not.toContain('확정 결과')
  })
})
