import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { AppProvider } from '../../../state/AppContext'
import { appReducer, buildInitialState } from '../../../state/appReducer'
import { TradeoffCandidates, nextRadioIndex } from '../TradeoffCandidates'

function render(initialState: ReturnType<typeof buildInitialState>): string {
  return renderToStaticMarkup(
    <AppProvider initialState={initialState}>
      <TradeoffCandidates />
    </AppProvider>,
  )
}

function doyun() {
  return RAW_SEED.people.find((p) => p.id === 'doyun')!
}

describe('TradeoffCandidates — 응답 후 후보군 3개(seed.expected.candidate_groups_post 재현)', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('상단: 응답 반영 상태·비교 가능한 후보 수·비교 안내가 보인다', () => {
    expect(html).toContain('도윤 님의 응답을 반영했어요')
    expect(html).toContain('비교할 수 있는 후보가 3개 있어요')
    expect(html).toContain('모두 참석하는 시간과 원하는 시간을 더 지키는 안을 비교해보세요.')
  })

  it('추천안: 금요일 오후 1시 · 6명 모두 참석 · 서연 님이 피하고 싶은 시간', () => {
    expect(html).toContain('추천')
    expect(html).toContain('금요일 오후 1시')
    expect(html).toContain('6명 모두 참석')
    expect(html).toContain('서연 님이 피하고 싶은 시간이에요.')
  })

  it('대안 1(접힌 상태): 수요일 오후 2–5시 · 5 / 6명 참석 · 도윤 제외와 나머지 조건 충족이 보인다', () => {
    expect(html).toContain('다른 안')
    expect(html).toContain('수요일 오후 2–5시')
    expect(html).toContain('5 / 6명 참석')
    expect(html).toContain('도윤 님은 참석하지 않아요. 나머지 5명의 원하는 시간은 모두 지켜요.')
    expect(html).toContain('시간 선택하기')
  })

  it('대안 2(접힌 상태): 월요일 오후 5시 · 4 / 6명 참석 · 도윤·수아 제외가 드러난다', () => {
    expect(html).toContain('월요일 오후 5시')
    expect(html).toContain('4 / 6명 참석')
    expect(html).toContain('도윤 님과 수아 님은 참석하지 않아요.')
  })

  it('확정 CTA는 화면 하단에 하나뿐이고, 최초 선택(추천·기본 시간)을 문구에 담는다', () => {
    const matches = html.match(/로 확정하기/g) ?? []
    expect(matches.length).toBe(1)
    expect(html).toContain('금요일 오후 1시로 확정하기')
    // CTA는 후보 카드(radiogroup) 바깥, 그 뒤(하단)에 있다 — 카드 내부에는 확정 CTA가 없다.
    const radiogroupStart = html.indexOf('role="radiogroup"')
    const radiogroupEnd = html.lastIndexOf('시간 선택하기')
    const ctaIndex = html.indexOf('로 확정하기')
    expect(radiogroupStart).toBeGreaterThan(-1)
    expect(ctaIndex).toBeGreaterThan(radiogroupEnd)
  })

  it('후보 카드는 radio 선택 구조이고 추천 후보가 최초 선택 상태다(aria-checked)', () => {
    const radios = html.match(/role="radio"/g) ?? []
    expect(radios.length).toBe(3)
    const checked = html.match(/aria-checked="true"/g) ?? []
    expect(checked.length).toBe(1)
    // 첫 radio(추천 카드)가 선택 상태다 — aria-checked="true"가 '추천' 라벨보다 앞서 나타난다.
    const checkedIndex = html.indexOf('aria-checked="true"')
    const recommendedLabelIndex = html.indexOf('>추천<')
    const alternativeLabelIndex = html.indexOf('>다른 안<')
    expect(checkedIndex).toBeLessThan(recommendedLabelIndex)
    expect(recommendedLabelIndex).toBeLessThan(alternativeLabelIndex)
  })

  it('내부 용어(트레이드오프·포기·미반영)는 사용자 화면에 노출되지 않는다', () => {
    expect(html).not.toContain('트레이드오프')
    expect(html).not.toContain('포기')
    expect(html).not.toContain('미반영')
  })

  it('cost 숫자는 어디에도 노출되지 않는다', () => {
    expect(html).not.toContain('>2<')
    expect(html).not.toContain('>3<')
    expect(html).not.toContain('>6<')
  })
})

describe('TradeoffCandidates — 한 줄 모드(완벽 슬롯 존재 + 잠정 배지)', () => {
  it('응답 전 상태(도윤 미응답)로 렌더링하면 한 줄 모드 + 잠정 배지가 보인다', () => {
    const html = render(buildInitialState())
    expect(html).toContain('모두 괜찮은 시간이 있어요')
    expect(html).toContain('수요일 오후 2시')
    expect(html).toContain('다른 시간 3개')
    expect(html).toContain('잠정')
    expect(html).toContain('수요일 오후 2시로 확정하기')
  })
})

describe('TradeoffCandidates — 빈 상태', () => {
  it('필수 참석자 한 명이 격자 전체를 막으면(자유 모드 인위적 충돌) 후보 슬롯이 0개가 되어 안내 문구가 보인다', () => {
    const state = buildInitialState()
    const blockedEverywhere = {
      ...state,
      people: state.people.map((p) =>
        p.id === 'jiwon'
          ? { ...p, calendar: RAW_SEED.grid.days.map((day) => ({ title: '충돌', day, hours: RAW_SEED.grid.hours })) }
          : p,
      ),
    }
    const html = render(blockedEverywhere)
    expect(html).toContain('가능한 시간이 없어요')
  })
})

describe('TradeoffCandidates — 후보 radiogroup 키보드 접근성(12B-2, roving tabindex)', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('선택된(추천) 카드의 라디오만 tabindex="0"이고 나머지는 "-1"이다(roving tabindex)', () => {
    const zeroTabIndex = html.match(/tabindex="0"/g) ?? []
    const negativeTabIndex = html.match(/role="radio"[^>]*tabindex="-1"/g) ?? []
    // 라디오 버튼 3개 중 정확히 1개만 tabindex=0(선택된 추천 카드), 나머지 2개는 -1.
    expect(zeroTabIndex.length).toBeGreaterThanOrEqual(1)
    expect(negativeTabIndex.length).toBe(2)
  })

  it('펼쳐진(선택된) 카드의 라디오는 aria-expanded="true"이고 접힌 카드는 "false"다', () => {
    const expandedTrue = html.match(/aria-expanded="true"/g) ?? []
    const expandedFalse = html.match(/aria-expanded="false"/g) ?? []
    expect(expandedTrue.length).toBe(1)
    expect(expandedFalse.length).toBe(2)
  })

  it('라디오 버튼에 aria-controls가 있고, 그 id를 가진 콘텐츠 영역이 실제로 존재한다(펼쳐진 카드만)', () => {
    const match = html.match(/aria-controls="(candidate-content-[^"]+)"/)
    expect(match).not.toBeNull()
    const contentId = match![1]
    expect(html).toContain(`id="${contentId}"`)
  })

  it('시간 선택 버튼에는 선택 상태를 나타내는 aria-pressed가 있다', () => {
    // 기본 펼침 상태(추천 카드)는 슬롯이 1개뿐이라 선택된 aria-pressed="true" 버튼만 존재한다 —
    // 여러 슬롯 중 하나만 선택되는 case(false 포함)는 SlotPicker 자체 테스트에서 다룬다.
    expect(html).toContain('aria-pressed="true"')
  })

  it('접힌 카드의 내용(시간 목록)은 렌더되지 않아 키보드 탐색 순서에도 없다(대안 카드는 "시간 선택하기"만 노출)', () => {
    // 추천 카드 1개만 펼쳐진 상태이므로, aria-controls로 연결된 콘텐츠 영역(id="candidate-content-...")은
    // 정확히 1개만 존재해야 한다 — 접힌 대안 2개는 그 안의 SlotPicker가 DOM에 없다.
    const contentRegions = html.match(/id="candidate-content-[^"]+"/g) ?? []
    expect(contentRegions.length).toBe(1)
  })
})

describe('TradeoffCandidates — 선택 카드 중첩 테두리 제거(12B-3 QA)', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('role=radio 버튼 자체에는 focus-visible outline 클래스가 없다(방향키 이동 시 헤더 안에 별도 테두리가 생기던 문제)', () => {
    const radioButtonTags = html.match(/<button[^>]*role="radio"[^>]*>/g) ?? []
    expect(radioButtonTags.length).toBe(3)
    for (const tag of radioButtonTags) {
      expect(tag).not.toContain('focus-visible:outline')
      expect(tag).toContain('outline-none')
    }
  })

  it('선택된 카드 하나에만 카드 외곽 선택 테두리(ring-1 ring-state-selected)가 나타난다', () => {
    const matches = html.match(/ring-1 ring-state-selected/g) ?? []
    expect(matches.length).toBe(1)
  })

  it('카드 컨테이너 3개 모두 focus-within 기반 단일 포커스 링 클래스를 갖는다(선택 링과 같은 자리에 합쳐짐)', () => {
    const matches = html.match(/focus-within:ring-2 focus-within:ring-state-selected/g) ?? []
    expect(matches.length).toBe(3)
  })

  it('12C-5: 선택된 카드와 선택된 시간 버튼에 state-selected-soft 배경 틴트가 적용된다(선택 1건 + 시간 1건)', () => {
    const matches = html.match(/bg-state-selected-soft/g) ?? []
    expect(matches.length).toBe(2)
  })
})

describe('nextRadioIndex — 방향키 순환 이동(12B-4, DOM 없이 순수 함수로 검증)', () => {
  it('ArrowDown/ArrowRight는 다음 인덱스로 이동한다', () => {
    expect(nextRadioIndex(0, 'ArrowDown', 3)).toBe(1)
    expect(nextRadioIndex(0, 'ArrowRight', 3)).toBe(1)
    expect(nextRadioIndex(1, 'ArrowDown', 3)).toBe(2)
  })

  it('ArrowUp/ArrowLeft는 이전 인덱스로 이동한다', () => {
    expect(nextRadioIndex(2, 'ArrowUp', 3)).toBe(1)
    expect(nextRadioIndex(2, 'ArrowLeft', 3)).toBe(1)
  })

  it('마지막 항목에서 다음으로 이동하면 첫 항목으로 순환한다', () => {
    expect(nextRadioIndex(2, 'ArrowDown', 3)).toBe(0)
    expect(nextRadioIndex(2, 'ArrowRight', 3)).toBe(0)
  })

  it('첫 항목에서 이전으로 이동하면 마지막 항목으로 순환한다', () => {
    expect(nextRadioIndex(0, 'ArrowUp', 3)).toBe(2)
    expect(nextRadioIndex(0, 'ArrowLeft', 3)).toBe(2)
  })

  it('화살표 키가 아니면 null을 반환한다(핸들러가 아무 것도 하지 않아야 함을 의미)', () => {
    expect(nextRadioIndex(0, 'Enter', 3)).toBeNull()
    expect(nextRadioIndex(0, ' ', 3)).toBeNull()
    expect(nextRadioIndex(0, 'Tab', 3)).toBeNull()
  })

  it('길이 0이면(카드가 없으면) 항상 null을 반환한다', () => {
    expect(nextRadioIndex(0, 'ArrowDown', 0)).toBeNull()
  })
})

describe('TradeoffCandidates — 응답 현황으로 뒤로가기(12B-4 QA)', () => {
  it('여러 후보 화면에 "← 응답 현황으로" 버튼이 있고, radiogroup 대상(tradeoff-screen) 바깥(형제)에 있다', () => {
    const state = appReducer(buildInitialState(), {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: doyun().response.chips,
    })
    const html = render(state)
    const backIndex = html.indexOf('← 응답 현황으로')
    const targetIndex = html.indexOf('data-tour-id="tradeoff-screen"')
    expect(backIndex).toBeGreaterThan(-1)
    expect(targetIndex).toBeGreaterThan(-1)
    expect(backIndex).toBeLessThan(targetIndex)
  })

  it('한 줄 모드(완벽 슬롯)에도 "← 응답 현황으로" 버튼이 있고, tradeoff-screen 대상 바깥에 있다', () => {
    const html = render(buildInitialState())
    const backIndex = html.indexOf('← 응답 현황으로')
    const targetIndex = html.indexOf('data-tour-id="tradeoff-screen"')
    expect(backIndex).toBeGreaterThan(-1)
    expect(targetIndex).toBeGreaterThan(-1)
    expect(backIndex).toBeLessThan(targetIndex)
  })

  it('클릭 핸들러는 history.back()이 아니라 기존 NAVIGATE 액션을 쓴다(리듀서 레벨 회귀 확인)', () => {
    const state = buildInitialState()
    const after = appReducer(state, { type: 'NAVIGATE', screen: 'host' })
    expect(after.screen).toBe('host')
  })

  it('투어 활성 상태에서 NAVIGATE를 디스패치해도 tour 상태는 그대로 유지된다(단계가 비정상 종료되지 않음)', () => {
    const state = { ...buildInitialState(), tour: { active: true, stepIndex: 2 } }
    const after = appReducer(state, { type: 'NAVIGATE', screen: 'host' })
    expect(after.tour).toEqual({ active: true, stepIndex: 2 })
  })

  it('SlotPicker의 시간 선택 버튼에는 role="radio"가 없다(radiogroup 방향키 핸들러가 이벤트 대상으로 구분할 수 있는 전제)', () => {
    const state = appReducer(buildInitialState(), {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: doyun().response.chips,
    })
    const html = render(state)
    const timeButtonTags = html.match(/<button[^>]*aria-pressed="[^"]*"[^>]*>/g) ?? []
    expect(timeButtonTags.length).toBeGreaterThan(0)
    for (const tag of timeButtonTags) {
      expect(tag).not.toContain('role="radio"')
    }
  })
})
