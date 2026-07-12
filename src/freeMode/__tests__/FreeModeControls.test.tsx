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
// draft 상태와 동일한 패턴). 펼친 상태의 내용(역할 섹션 구성, 리셋·참여자 체험 진입)은 12B-1에서도
// 같은 방식으로 코드 검토로 확인했던 부분이라 이번에도 동일하게 다룬다 — 여기서는 자동화 가능한
// "기본값은 접힌 상태" + 접힌 버튼의 aria 배선만 검증한다.
describe('FreeModeControls — 역할 중심 체험 도구, 접기/펼치기(12B-2)', () => {
  it('체험 기능 잠금 해제 전에는 아무것도 렌더링하지 않는다', () => {
    const html = render(buildInitialState())
    expect(html).toBe('')
  })

  it('잠금 해제 직후에는 접힌 상태로 시작해 "다른 역할 체험하기" 버튼만 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).toContain('다른 역할 체험하기')
  })

  it('접힌 버튼은 aria-expanded=false와 aria-controls로 펼친 패널에 연결된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls="role-experience-panel"')
  })

  it('12C-7: 접힌 pill은 "처음부터 다시 보기"(bottom-4) 위인 bottom-16에 있다 — 다시 보기 위치를 침범하지 않음', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).toContain('bottom-16')
    expect(html).not.toContain('bottom-4 ')
  })

  it('접힌 상태에서는 펼친 콘텐츠(리셋·역할 이동·참여자 체험 진입)와 내부 용어가 보이지 않는다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)

    expect(html).not.toContain('처음부터 다시 보기')
    expect(html).not.toContain('응답 현황 보기')
    expect(html).not.toContain('후보 시간 비교하기')
    expect(html).not.toContain('참여자로 체험하기')
    expect(html).not.toContain('역할을 바꿔 체험해보세요')
    // 사용자 화면 어디에도 내부 상태명이 노출되지 않는다.
    expect(html).not.toContain('자유 모드')
    expect(html).not.toContain('트레이드오프')
  })

  it('확정된 회의가 있어도 접힌 상태에서는 여전히 펼치기 버튼 하나만 보인다(과도하게 화면을 가리지 않음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] })
    const html = render(state)

    expect(html).toContain('다른 역할 체험하기')
    expect(html).not.toContain('확정 결과 보기')
  })

  // "처음부터 다시 보기"는 12B-3에서 EvaluatorResetBar(앱 상단 독립 액션)로 분리됐다 — 역할
  // 전환("다른 역할 체험하기")과 전체 리셋은 의미가 다르다는 확정된 UX 결정. 이 컴포넌트가
  // 접힌 상태에서는 위 테스트가 이미 부재를 확인하지만(SSR은 기본 접힘만 재현 가능), 여기서는
  // 컴포넌트가 더 이상 ResetButton을 렌더링하지 않는다는 걸 별도로 명시한다(펼친 상태의 내용은
  // 이 프로젝트의 공통 한계상 SSR로 직접 펼쳐볼 수 없어 코드 검토로 확인 — EvaluatorResetBar.test.tsx가
  // 독립 리셋 버튼의 존재는 별도로 검증한다).
  it('"처음부터 다시 보기" 문구는 이 컴포넌트 어디에도 없다(EvaluatorResetBar로 분리됨)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const html = render(state)
    expect(html).not.toContain('처음부터 다시 보기')
  })
})
