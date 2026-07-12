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

// FreeModeControls의 접기/펼치기는 컴포넌트 로컬 useState(마운트 시 기본값 true)라, SSR 단일
// 렌더로는 "펼친 뒤 접기를 누른" 상태나 "다시 조율하기로 재접힘" 전환을 직접 재현할 수 없다(이
// 프로젝트가 jsdom·RTL 없이 react-dom/server만 쓰기로 한 결정에 따른 공통 한계 — ParticipantPhoneFrame의
// draft 상태와 동일한 패턴). 펼친 상태의 내용(리셋·화면 이동·참여자 체험 진입)은 이전과 동일한 JSX가
// collapsed 조건부 뒤로 옮겨진 것뿐이라 코드 검토로 확인했고, 여기서는 자동화 가능한 "기본값은 접힌
// 상태" 사실만 검증한다.
describe('FreeModeControls — 접기/펼치기(12B-1 QA 수정: 기본값은 접힘)', () => {
  it('자유 모드 해제 전에는 아무것도 렌더링하지 않는다', () => {
    const html = render(buildInitialState())
    expect(html).toBe('')
  })

  it('자유 모드 해제 직후에는 접힌 상태로 시작해 "체험 도구 펼치기" 버튼만 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).toContain('체험 도구 펼치기')
  })

  it('접힌 상태에서는 펼친 콘텐츠(리셋·화면 이동·참여자 체험 진입)가 보이지 않는다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).not.toContain('처음부터 다시 보기')
    expect(html).not.toContain('주최자 화면')
    expect(html).not.toContain('트레이드오프')
    expect(html).not.toContain('참여자로 체험하기')
    expect(html).not.toContain('평가용 기능이에요')
    expect(html).not.toContain('참석자 필수/선택 변경')
  })

  it('확정된 회의가 있어도 접힌 상태에서는 여전히 펼치기 버튼 하나만 보인다(과도하게 화면을 가리지 않음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] })
    const html = render(state)

    expect(html).toContain('체험 도구 펼치기')
    expect(html).not.toContain('확정 결과')
  })
})
