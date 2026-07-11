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

describe('FreeModeControls', () => {
  it('자유 모드 해제 전에는 아무것도 렌더링하지 않는다', () => {
    const html = render(buildInitialState())
    expect(html).toBe('')
  })

  it('자유 모드 해제 후에는 리셋 버튼과 참석자 필수/선택 토글이 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).toContain('처음부터 다시 보기')
    expect(html).toContain('참석자 필수/선택 변경')
    expect(html).toContain('도윤')
    expect(html).toContain('선택')
    expect(html).toContain('주최자 화면')
    expect(html).toContain('트레이드오프')
  })

  it('확정된 회의가 없으면 "확정 결과" 이동 버튼은 보이지 않는다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)
    expect(html).not.toContain('확정 결과')
  })

  it('주최자(지원)는 필수/선택 토글 목록에서 제외된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)
    // "지원"이라는 이름이 토글 목록 항목으로 등장하지 않아야 한다(리스트 아이템 텍스트로 없음).
    const toggleSection = html.slice(html.indexOf('참석자 필수/선택 변경'))
    expect(toggleSection).not.toContain('>지원<')
  })
})
