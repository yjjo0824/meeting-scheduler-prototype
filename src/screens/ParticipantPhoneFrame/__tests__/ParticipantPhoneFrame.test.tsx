import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { appReducer, buildInitialState } from '../../../state/appReducer'
import { AppProvider } from '../../../state/AppContext'
import { ParticipantPhoneFrame } from '../ParticipantPhoneFrame'

function render(initialState: ReturnType<typeof buildInitialState>): string {
  return renderToStaticMarkup(
    <AppProvider initialState={initialState}>
      <ParticipantPhoneFrame />
    </AppProvider>,
  )
}

describe('ParticipantPhoneFrame — 5층 구조(맥락→확인→진술→검수→제출)', () => {
  const opened = appReducer(buildInitialState(), { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
  const html = render(opened)

  it('맥락 헤더: 요청자·회의명·범위·기한이 표시된다', () => {
    expect(html).toContain('지원 님이 회의 시간 조율을 요청했어요')
    expect(html).toContain(RAW_SEED.meeting.title)
    expect(html).toContain(RAW_SEED.meeting.response_deadline)
  })

  it('캘린더 프리필: 월요일 일정 카드와 "화–금 일정 없음" 접힘 표기가 보인다', () => {
    expect(html).toContain('캘린더 · 탭해서 정정')
    expect(html).toContain('화–금 일정 없음')
  })

  it('자연어 입력 질문 문구가 정확히 표시된다', () => {
    expect(html).toContain('여기 없는 일정이나 피하고 싶은 시간이 있나요?')
  })

  it('응답 전에는 칩 검수 영역이 비어 있다(seed의 정답 칩이 미리 노출되지 않음)', () => {
    expect(html).toContain('아직 추가한 조건이 없어요')
    expect(html).not.toContain('외부 미팅')
    expect(html).not.toContain('웬만하면')
  })

  it('신뢰 문구가 제출 버튼 바로 위에 존재한다', () => {
    expect(html).toContain('주최자에게는 조건만 전달돼요. 이유와 원문은 보이지 않아요.')
    expect(html).toContain('응답 보내기')
  })
})

describe('ParticipantPhoneFrame — 이미 응답한 사람을 자유 모드에서 다시 열면 기존 칩이 보인다', () => {
  it('민준의 회피 칩이 검수 목록에 표시된다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'minjun' })
    const html = render(state)

    expect(html).toContain('[회피]')
    expect(html).toContain('9시')
  })
})

describe('ParticipantPhoneFrame — 확정 후 잠금', () => {
  it('확정된 뒤에는 읽기 전용 안내와 신고 버튼만 보인다(상세 재조율 플로우 없음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'seoyeon' })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] })
    const html = render(state)

    expect(html).toContain('회의가 확정됐어요')
    expect(html).toContain('확정된 시간에 참석이 어려워졌어요')
    expect(html).not.toContain('응답 보내기')
  })
})

describe('ParticipantPhoneFrame — R4 공개 범위: 본인 화면에는 원문·사유가 보여도 된다', () => {
  it('이미 응답한 도윤 자신의 화면에는 cue가 흐리게라도 노출된다(본인 = 전부)', () => {
    let state = buildInitialState()
    state = appReducer(state, {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: RAW_SEED.people.find((p) => p.id === 'doyun')!.response.chips,
    })
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    const html = render(state)

    expect(html).toContain('웬만하면')
  })
})
