import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { appReducer, buildInitialState } from '../../../state/appReducer'
import { AppProvider } from '../../../state/AppContext'
import { ParticipantPhoneFrame, buildDraftChips } from '../ParticipantPhoneFrame'
import { parseChips } from '../../../parser/ruleBasedParser'

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

  it('자연어 입력 질문·보조 문구가 정확히 표시된다', () => {
    expect(html).toContain('캘린더에 없는 일정이 있나요?')
    expect(html).toContain('피하고 싶은 시간도 편하게 적어주세요.')
  })

  it('칩 검수 제목·보조 문구가 표시된다', () => {
    expect(html).toContain('이렇게 이해했어요')
    expect(html).toContain('다른 내용은 눌러서 고칠 수 있어요.')
  })

  it('응답 전에는 칩 검수 영역이 비어 있다(seed의 정답 칩이 미리 노출되지 않음)', () => {
    expect(html).toContain('아직 추가한 조건이 없어요')
    expect(html).not.toContain('외부 미팅')
    expect(html).not.toContain('웬만하면')
  })

  it('신뢰 문구(주최자 이름 파생)와 제출 CTA가 하단 고정 영역에 존재한다', () => {
    // "주최자" 역할 명칭 대신 실제 주최자 이름(지원)이 seed에서 파생되어 들어간다.
    expect(html).toContain('지원 님에게는 시간 조건만 보여요. 작성한 문장과 이유는 보이지 않아요.')
    expect(html).toContain('이대로 응답하기')
    // 입력 콘텐츠는 스크롤 영역에, 신뢰 문구+CTA는 그 밖(하단 고정)에 있다.
    const scrollEnd = html.indexOf('</div><div class="space-y-2 border-t border-slate-100 pt-3">')
    expect(scrollEnd).toBeGreaterThan(-1)
  })

  it('회귀 방지: 패널이 별도 z-index wrapper 없이 배경과 형제로 렌더된다', () => {
    // 이전 버그: <div class="fixed inset-0 z-50"><배경/><패널 data-tour-id=.../></div> 처럼
    // 패널을 감싸는 wrapper가 있으면, 그 wrapper의 z-index(50)가 새 스태킹 컨텍스트를 만들어
    // TourOverlay가 패널에 주입하는 z-index:900이 TourClickBlocker(z-800)를 절대 넘어서지 못했다.
    // "패널 자신이 fixed로 직접 배치돼 있고, 배경과 같은 레벨의 형제"임을 구조적으로 확인한다.
    const backdropIndex = html.indexOf('bg-black/40')
    const panelIndex = html.indexOf('data-tour-id="phone-frame"')
    expect(backdropIndex).toBeGreaterThan(-1)
    expect(panelIndex).toBeGreaterThan(backdropIndex)

    const panelTagStart = html.lastIndexOf('<div', panelIndex)
    const panelTagEnd = html.indexOf('>', panelIndex)
    const panelTag = html.slice(panelTagStart, panelTagEnd)
    expect(panelTag).toContain('fixed')

    // 패널 태그 시작 지점 앞에서 배경 div가 이미 닫혀 있어야 한다(중첩이 아니라 형제).
    const closedBackdropBeforePanel = html.slice(0, panelTagStart).trimEnd().endsWith('</div>')
    expect(closedBackdropBeforePanel).toBe(true)
  })
})

describe('ParticipantPhoneFrame — 이미 응답한 사람을 자유 모드에서 다시 열면 "제출 완료" 요약이 먼저 보인다(IMPLEMENTATION_SPEC §5)', () => {
  it('민준을 다시 열면 편집 폼이 아니라 응답 요약 + 수정하기 진입점이 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'minjun' })
    const html = render(state)

    expect(html).toContain('응답을 보냈어요')
    expect(html).toContain('회의가 확정되기 전까지 언제든 바꿀 수 있어요.')
    expect(html).toContain('전달한 시간 조건')
    expect(html).toContain('수요일')
    expect(html).toContain('9시')
    expect(html).toContain('가급적 피함')
    expect(html).toContain('응답 수정하기')
    // 요약 상태에서는 아직 편집 폼(질문 문구·제출 버튼)이 보이지 않는다.
    expect(html).not.toContain('캘린더에 없는 일정이 있나요?')
    expect(html).not.toContain('이대로 응답하기')
    // 다시 조율 상태가 아니므로 그대로 보내기 CTA도 없다.
    expect(html).not.toContain('이 조건 그대로 보내기')
  })

  it('민준의 요약은 캘린더/직접 입력 출처를 구분해 보여준다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'minjun' })
    const html = render(state)

    expect(html).toContain('캘린더 일정')
    expect(html).toContain('직접 알려줌')
  })

  it('민준의 요약에는 응답 칩뿐 아니라 캘린더 조건도 함께 보인다(항목 2: 전체 조건 표시)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'minjun' })
    const html = render(state)

    // 민준의 캘린더: 화요일 고객사 방문, 목요일 현장 실사 — chips에는 없고 calendar에만 있는 조건.
    expect(html).toContain('화요일')
    expect(html).toContain('목요일')
    expect(html).toContain('참석 어려움')
  })

  it('서연의 요약은 캘린더 3건 + 응답 칩 1건을 요일별로 묶어 전부 보여준다(항목 2 예시 재현)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'seoyeon' })
    const html = render(state)

    expect(html).toContain('월요일')
    expect(html).toContain('15~16시')
    expect(html).toContain('수요일')
    expect(html).toContain('9~10시')
    expect(html).toContain('금요일')
    expect(html).toContain('10~11시')
    expect(html).toContain('매일')
    expect(html).toContain('13시')
    expect(html).toContain('가급적 피함')
    // 참석 어려움(캘린더 3건)이 최소 3곳에서 등장해야 한다.
    expect(html.split('참석 어려움').length - 1).toBeGreaterThanOrEqual(3)
  })

  it('미응답자(도윤)를 처음 열면 요약 없이 바로 입력 폼이 보인다', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    const html = render(state)

    expect(html).not.toContain('응답을 보냈어요')
    expect(html).toContain('캘린더에 없는 일정이 있나요?')
  })
})

describe('ParticipantPhoneFrame — 확정 후 잠금', () => {
  it('확정된 뒤에는 확정 결과가 먼저 보이고, 읽기 전용 조건 요약과 신고 버튼만 있다(상세 재조율 플로우 없음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'seoyeon' })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] })
    const html = render(state)

    expect(html).toContain('회의 시간이 정해졌어요')
    // 날짜·시간은 seed.schedule_display + 확정 슬롯에서 파생된다.
    expect(html).toContain('7월 17일(금) 오후 1:00–2:00')
    expect(html).toContain('이제 응답은 수정할 수 없어요.')
    expect(html).toContain('전달한 시간 조건')
    expect(html).toContain('이 시간에 참석하기 어려워졌어요')
    expect(html).not.toContain('이대로 응답하기')
    expect(html).not.toContain('응답 수정하기')
  })
})

describe('ParticipantPhoneFrame — 다시 조율 상태(신고 후 재오픈, 파생 상태)', () => {
  function rescheduleState() {
    // 확정 → 서연이 참석 어려움 신고 → 주최자가 다시 조율하기 — 재조율 데모의 정식 경로.
    let state = buildInitialState()
    state = appReducer(state, { type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: [] })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] })
    state = appReducer(state, { type: 'REPORT_UNAVAILABLE', personId: 'seoyeon' })
    state = appReducer(state, { type: 'REOPEN_FOR_RESCHEDULE' })
    return state
  }

  it('이미 응답한 사람을 열면 "다시 조율 중" 배지와 그대로 보내기 CTA가 보인다', () => {
    let state = rescheduleState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'seoyeon' })
    const html = render(state)

    expect(html).toContain('다시 조율 중')
    expect(html).toContain('이전에 보낸 조건을 다시 확인해주세요')
    expect(html).toContain('바뀐 내용만 수정하면 돼요.')
    expect(html).toContain('이 조건 그대로 보내기')
    expect(html).toContain('응답 수정하기')
  })

  it('신고 없이 확정 전 상태에서는 다시 조율 배지가 나타나지 않는다(파생 조건의 무해한 축소)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'minjun' })
    const html = render(state)
    expect(html).not.toContain('다시 조율 중')
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

describe('buildDraftChips — 기존 응답 보존 + 자연어 교체 시 누적 금지(12B QA)', () => {
  const grid = RAW_SEED.grid

  it('새 자연어에서 파싱된 칩이 기존 응답 칩을 덮어쓰지 않고 함께 남는다(출처 태그 구분)', () => {
    const seoyeon = RAW_SEED.people.find((p) => p.id === 'seoyeon')!
    const committed = seoyeon.response.chips // [회피 매일 13시]
    const parsed = parseChips({ raw: '월요일 오전 안 돼요', calendarEvents: seoyeon.calendar, grid })

    const merged = buildDraftChips(committed, parsed)

    expect(merged).toHaveLength(committed.length + parsed.length)
    expect(merged[0].chip).toMatchObject({ type: '회피', day: '*', hours: [13] })
    expect(merged[0].origin).toBe('manual')
    expect(merged[merged.length - 1].chip).toMatchObject({ type: '불가', day: '월', hours: [9, 10, 11] })
    expect(merged[merged.length - 1].origin).toBe('text')
  })

  it('자연어를 바꾸면 이전 textChips가 최신 파싱 결과로 교체되고 누적되지 않는다', () => {
    // '금요일 오후 안 돼요' → 문장을 '금요일 오후 2시 이후 안 돼요'로 교체하는 시나리오 —
    // textChips는 항상 "현재 문장의 파싱 결과"만 담으므로(승격 없음) 두 번째 결과만 남는다.
    const first = parseChips({ raw: '금요일 오후 안 돼요', calendarEvents: [], grid })
    expect(buildDraftChips([], first).map((t) => t.chip)).toMatchObject([
      { type: '불가', day: '금', hours: [13, 14, 15, 16, 17] },
    ])

    const second = parseChips({ raw: '금요일 오후 2시 이후 안 돼요', calendarEvents: [], grid })
    const replaced = buildDraftChips([], second)
    expect(replaced).toHaveLength(1)
    expect(replaced[0].chip).toMatchObject({ type: '불가', day: '금', hours: [14, 15, 16, 17] })
  })

  it('자연어를 비우면 textChips만 사라지고 manual(기존 응답) 칩은 유지된다', () => {
    const seoyeon = RAW_SEED.people.find((p) => p.id === 'seoyeon')!
    const emptied = buildDraftChips(seoyeon.response.chips, [])
    expect(emptied).toHaveLength(seoyeon.response.chips.length)
    expect(emptied.every((t) => t.origin === 'manual')).toBe(true)
  })

  it('동일 조건(type·day·hours)이 겹치면 manual 쪽 한 번만 남는다', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const committed = doyun.response.chips
    const reparsed = parseChips({ raw: doyun.response.raw!, calendarEvents: doyun.calendar, grid })

    const merged = buildDraftChips(committed, reparsed)

    expect(merged).toHaveLength(committed.length)
    expect(merged.every((t) => t.origin === 'manual')).toBe(true)
  })

  it('빈 기존 응답(첫 응답자)에서는 파싱 결과만 남는다 — 기존 동작 유지', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const parsed = parseChips({ raw: doyun.response.raw!, calendarEvents: doyun.calendar, grid })
    expect(buildDraftChips([], parsed).map((t) => t.chip)).toEqual(parsed)
  })
})

describe('ParticipantPhoneFrame — dialog 접근성 배선(12B-2)', () => {
  it('role=dialog, aria-modal=true, aria-labelledby가 제목 id를 가리킨다', () => {
    const opened = appReducer(buildInitialState(), { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    const html = renderToStaticMarkup(
      <AppProvider initialState={opened}>
        <ParticipantPhoneFrame />
      </AppProvider>,
    )
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-labelledby="phone-frame-title"')
    expect(html).toContain('id="phone-frame-title"')
  })

  it('제출 전(편집 폼) 상태: 자연어 입력에 최초 포커스 표식이 있다', () => {
    const opened = appReducer(buildInitialState(), { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    const html = renderToStaticMarkup(
      <AppProvider initialState={opened}>
        <ParticipantPhoneFrame />
      </AppProvider>,
    )
    const textareaStart = html.indexOf('<textarea')
    const textareaEnd = html.indexOf('>', textareaStart)
    expect(html.slice(textareaStart, textareaEnd)).toContain('data-phone-focus-target="true"')
  })

  it('제출 완료 상태: "응답 수정하기" 버튼에 최초 포커스 표식이 있다(자연어 입력에는 없음)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'minjun' })
    const html = renderToStaticMarkup(
      <AppProvider initialState={state}>
        <ParticipantPhoneFrame />
      </AppProvider>,
    )
    expect(html).not.toContain('<textarea')
    expect(html).toContain('data-phone-focus-target="true"')
    const markerIndex = html.indexOf('data-phone-focus-target="true"')
    const buttonEnd = html.indexOf('</button>', markerIndex)
    expect(html.slice(markerIndex, buttonEnd)).toContain('응답 수정하기')
  })

  it('확정 후(잠금) 상태: 편집 폼에만 있는 포커스 표식이 없고, 닫기 버튼이 항상 존재한다(폴백 대상)', () => {
    let state = buildInitialState()
    state = appReducer(state, { type: 'OPEN_PHONE_FRAME', personId: 'seoyeon' })
    state = appReducer(state, { type: 'CONFIRM_MEETING', groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] })
    const html = renderToStaticMarkup(
      <AppProvider initialState={state}>
        <ParticipantPhoneFrame />
      </AppProvider>,
    )
    expect(html).not.toContain('data-phone-focus-target')
    expect(html).toContain('>닫기<')
  })

  it('배경 클릭 핸들러는 투어 활성 여부를 확인한다(코드 검토 보완: 클릭 이벤트는 SSR로 재현 불가)', () => {
    // renderToStaticMarkup은 onClick을 실행하지 않는다 — "투어 중 배경 클릭 무시"는
    // ParticipantPhoneFrame.tsx의 onClick 핸들러(if (!state.tour.active) ...)로 코드 검토 확인.
    // 여기서는 배경 div가 실제로 렌더되는지만 구조적으로 확인한다.
    const opened = appReducer(buildInitialState(), { type: 'OPEN_PHONE_FRAME', personId: 'doyun' })
    const html = renderToStaticMarkup(
      <AppProvider initialState={opened}>
        <ParticipantPhoneFrame />
      </AppProvider>,
    )
    expect(html).toContain('bg-black/40')
  })
})
