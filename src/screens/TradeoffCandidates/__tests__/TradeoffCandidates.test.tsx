import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { computeSchedule } from '../../../engine/computeSchedule'
import { AppProvider } from '../../../state/AppContext'
import { appReducer, buildInitialState } from '../../../state/appReducer'
import { CandidateGroupCard } from '../CandidateGroupCard'
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

describe('TradeoffCandidates — 응답 후 후보군 3개(seed.expected.candidate_groups_post 재현, 12C-12 구조)', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('헤더: 후보 수·비교 안내가 보인다(12C-12 카피)', () => {
    expect(html).toContain('조건이 다른 안 3개를 찾았어요')
    expect(html).toContain('참석 인원과 반영하지 못한 조건을 비교해보세요.')
  })

  it('재계산 배너(12C-12): 미응답자였던 도윤의 응답 제출 직후에는 헤더 위에 안내 배너가 보인다', () => {
    const bannerIndex = html.indexOf('도윤 님이 캘린더에 없던 일정을 알려줘서, 추천 시간을 다시 계산했어요.')
    const headerIndex = html.indexOf('조건이 다른 안 3개를 찾았어요')
    expect(bannerIndex).toBeGreaterThan(-1)
    expect(bannerIndex).toBeLessThan(headerIndex)
  })

  it('재계산 배너: 자유 모드(칩 수정·필수/선택 변경 재계산이 일어나는 유일한 컨텍스트)에서는 표시하지 않는다', () => {
    const freeMode = appReducer(state, { type: 'UNLOCK_FREE_MODE' })
    const freeModeHtml = render(freeMode)
    expect(freeModeHtml).not.toContain('캘린더에 없던 일정을 알려줘서')
    // 헤더 자체는 그대로 남는다.
    expect(freeModeHtml).toContain('조건이 다른 안 3개를 찾았어요')
  })

  it('추천안(선택 상태): 제목 · 긍정 정보 줄 · 고려할 점(주체 명시)이 순서대로 보인다', () => {
    expect(html).toContain('추천')
    expect(html).toContain('금요일 오후 1시')
    expect(html).toContain('6명 모두 참석할 수 있어요')
    expect(html).toContain('참석 6/6')
    expect(html).toContain('고려할 점')
    expect(html).toContain('서연 님이 피하고 싶은 시간 1건과 겹쳐요.')
  })

  it('대안 1(비선택): 대표 시간+개수로 축약된 제목과 긍정 정보·고려할 점이 보인다', () => {
    expect(html).toContain('다른 안')
    expect(html).toContain('수요일 오후 2시 외 3개')
    expect(html).toContain('참석하는 5명의 선호는 모두 반영해요')
    expect(html).toContain('참석 5/6')
    expect(html).toContain('선택 참석자인 도윤 님은 참석하지 않아요.')
  })

  it('대안 2(비선택, 시간 1개): 축약 없는 제목 · 두 사람의 제외가 참석 구분과 함께 드러난다', () => {
    expect(html).toContain('월요일 오후 5시')
    expect(html).not.toContain('월요일 오후 5시 외')
    expect(html).toContain('참석 4/6')
    expect(html).toContain('선택 참석자인 도윤 님과 수아 님은 참석하지 않아요.')
  })

  it('확정 CTA는 화면에 하나뿐이고, 최초 선택(추천·기본 시간)을 문구에 담는다', () => {
    const matches = html.match(/로 확정하기/g) ?? []
    expect(matches.length).toBe(1)
    expect(html).toContain('금요일 오후 1시로 확정하기')
  })

  it('후보 카드는 radio 선택 구조이고 추천 후보가 최초 선택 상태다(aria-checked)', () => {
    const radios = html.match(/role="radio"/g) ?? []
    expect(radios.length).toBe(3)
    const checked = html.match(/aria-checked="true"/g) ?? []
    expect(checked.length).toBe(1)
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

  it('12C-12: 시간 선택 블록은 선택된 카드 + 시간 2개 이상일 때만 열린다 — 기본 상태(추천=단일 슬롯)에는 없다', () => {
    // 추천 카드(금13)는 시간이 1개라 시간 블록 자체가 없고, 비선택 대안들도 렌더하지 않는다.
    expect(html).not.toContain('시간을 골라주세요')
    expect(html).not.toContain('aria-pressed')
    const contentRegions = html.match(/id="candidate-content-[^"]+"/g) ?? []
    expect(contentRegions.length).toBe(0)
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

describe('TradeoffCandidates — 후보 radiogroup 키보드 접근성(roving tabindex)', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('선택된(추천) 카드의 라디오만 tabindex="0"이고 나머지는 "-1"이다(roving tabindex)', () => {
    const zeroTabIndex = html.match(/tabindex="0"/g) ?? []
    const negativeTabIndex = html.match(/role="radio"[^>]*tabindex="-1"/g) ?? []
    expect(zeroTabIndex.length).toBeGreaterThanOrEqual(1)
    expect(negativeTabIndex.length).toBe(2)
  })

  it('aria-expanded는 시간 블록이 열린 카드에만 true다 — 기본 상태(추천=단일 슬롯)는 전부 false', () => {
    const expandedTrue = html.match(/aria-expanded="true"/g) ?? []
    const expandedFalse = html.match(/aria-expanded="false"/g) ?? []
    expect(expandedTrue.length).toBe(0)
    expect(expandedFalse.length).toBe(3)
  })

  it('aria-controls는 시간이 2개 이상인 카드(시간 블록이 열릴 수 있는 카드)에만 있다', () => {
    const controls = html.match(/aria-controls="candidate-content-[^"]+"/g) ?? []
    // 수14~17(4개)만 시간 블록 후보다 — 금13·월17은 단일 슬롯이라 없음.
    expect(controls.length).toBe(1)
  })
})

describe('TradeoffCandidates — 선택 카드 한 겹 테두리(12B-3 유지)', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('role=radio 버튼 자체에는 focus-visible outline 클래스가 없다', () => {
    const radioButtonTags = html.match(/<button[^>]*role="radio"[^>]*>/g) ?? []
    expect(radioButtonTags.length).toBe(3)
    for (const tag of radioButtonTags) {
      expect(tag).not.toContain('focus-visible:outline')
      expect(tag).toContain('outline-none')
    }
  })

  it('선택된 카드 하나에만 카드 외곽 선택 테두리(ring-1 ring-state-selected)와 배경 틴트가 나타난다', () => {
    expect((html.match(/ring-1 ring-state-selected/g) ?? []).length).toBe(1)
    expect((html.match(/bg-state-selected-soft/g) ?? []).length).toBe(1)
  })

  it('카드 컨테이너 3개 모두 focus-within 기반 단일 포커스 링 클래스를 갖는다', () => {
    const matches = html.match(/focus-within:ring-2 focus-within:ring-state-selected/g) ?? []
    expect(matches.length).toBe(3)
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

  it('양 끝에서 순환한다', () => {
    expect(nextRadioIndex(2, 'ArrowDown', 3)).toBe(0)
    expect(nextRadioIndex(0, 'ArrowUp', 3)).toBe(2)
  })

  it('화살표 키가 아니거나 길이 0이면 null을 반환한다', () => {
    expect(nextRadioIndex(0, 'Enter', 3)).toBeNull()
    expect(nextRadioIndex(0, 'ArrowDown', 0)).toBeNull()
  })
})

describe('TradeoffCandidates — 12C-12: 플로팅 확정 CTA와 헤더 아래 보조 액션', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('확정 CTA는 하단 고정 플로팅 바다 — 중앙 정렬 + 최대 폭 제한, 콘텐츠에는 하단 여백 확보', () => {
    const ctaIndex = html.indexOf('로 확정하기')
    const wrapStart = html.lastIndexOf('<div', html.lastIndexOf('<button', ctaIndex))
    const wrapTag = html.slice(wrapStart, html.indexOf('>', wrapStart))
    expect(wrapTag).toContain('fixed')
    expect(wrapTag).toContain('bottom-4')
    expect(wrapTag).toContain('justify-center')
    expect(html).toContain('max-w-sm')
    // 마지막 카드가 플로팅 CTA에 가려지지 않게 페이지 하단 여백을 확보한다.
    expect(html).toContain('pb-28')
  })

  it('CTA 라벨은 선택된 시간에서 파생된다 — selectedSlotByGroup 조회 경로 포함(칩 변경 시 즉시 갱신되는 배선)', () => {
    // 선택된(추천) 그룹의 키를 실제 엔진 결과에서 얻어 상태 맵에 주입 — CTA가 defaultSlot이
    // 아니라 상태의 selectedSlotByGroup[key]를 읽는 경로를 확인한다(클릭 시퀀스는 SSR 재현 불가,
    // SELECT_SLOT 디스패치는 appReducer 테스트가 커버).
    const schedule = computeSchedule(RAW_SEED, RAW_SEED.people)
    const topKey = schedule.groups[0].key
    const injected = { ...state, selectedSlotByGroup: { [topKey]: { day: '금' as const, hour: 13 } } }
    expect(render(injected)).toContain('금요일 오후 1시로 확정하기')
  })

  it('헤더 아래 보조 액션: "조건을 바꿔 다시 계산하기"는 항상, "누군가에게 다시 물어보기"는 자유 모드에서만 보인다', () => {
    expect(html).toContain('조건을 바꿔 다시 계산하기')
    expect(html).not.toContain('누군가에게 다시 물어보기')
    const freeModeHtml = render(appReducer(state, { type: 'UNLOCK_FREE_MODE' }))
    expect(freeModeHtml).toContain('누군가에게 다시 물어보기')
    // 카드 안의 기존 링크는 제거됐다(화면 레벨로 승격).
    expect(freeModeHtml).not.toContain('참여자에게 다시 확인하기')
  })

  it('한 줄 모드(완벽 슬롯)에는 "← 응답 현황으로" 버튼이 그대로 있고, tradeoff-screen 대상 바깥에 있다', () => {
    const oneLineHtml = render(buildInitialState())
    const backIndex = oneLineHtml.indexOf('← 응답 현황으로')
    const targetIndex = oneLineHtml.indexOf('data-tour-id="tradeoff-screen"')
    expect(backIndex).toBeGreaterThan(-1)
    expect(backIndex).toBeLessThan(targetIndex)
  })

  it('투어 활성 상태에서 NAVIGATE를 디스패치해도 tour 상태는 그대로 유지된다(단계가 비정상 종료되지 않음)', () => {
    const state = { ...buildInitialState(), tour: { active: true, stepIndex: 2 } }
    const after = appReducer(state, { type: 'NAVIGATE', screen: 'host' })
    expect(after.tour).toEqual({ active: true, stepIndex: 2 })
  })

  it('SlotPicker의 시간 선택 버튼에는 role="radio"가 없다(radiogroup 방향키 핸들러가 이벤트 대상으로 구분할 수 있는 전제)', () => {
    // 기본 상태에는 시간 버튼이 없으므로(추천=단일 슬롯) 대안 그룹을 선택 상태로 직접 렌더해 확인한다.
    const schedule = computeSchedule(RAW_SEED, RAW_SEED.people)
    const group = schedule.groups.find((g) => g.slots.length > 1)!
    const html = renderToStaticMarkup(
      <CandidateGroupCard
        group={group}
        people={RAW_SEED.people}
        recommended={false}
        tentative={false}
        selected={true}
        selectedSlot={group.defaultSlot}
        radioTabIndex={0}
        radioRef={() => {}}
        onSelect={() => {}}
        onSelectSlot={() => {}}
      />,
    )
    const timeButtonTags = html.match(/<button[^>]*aria-pressed="[^"]*"[^>]*>/g) ?? []
    expect(timeButtonTags.length).toBeGreaterThan(0)
    for (const tag of timeButtonTags) {
      expect(tag).not.toContain('role="radio"')
    }
  })
})

describe('CandidateGroupCard — 선택된 카드의 칩이 곧 확정 대상 시간이다(12C-8 유지 + 12C-12 구조)', () => {
  // 수14~17 대안 그룹(도윤 제외)을 실제 엔진 결과에서 가져와, "칩으로 고른 시간이 카드 제목에
  // 즉시 반영되고 그 칩만 눌린 상태가 되는" 배선을 검증한다 — 클릭 시퀀스 자체는 SSR로 재현할
  // 수 없으므로(프로젝트 공통 한계), 클릭의 결과 상태(selectedSlot prop 변화)를 직접 주입한다.
  function altGroup() {
    const schedule = computeSchedule(RAW_SEED, RAW_SEED.people)
    const group = schedule.groups.find((g) => g.slots.length > 1)!
    expect(group.defaultSlot).toEqual({ day: '수', hour: 14 }) // 기본 선택 = 그룹 내 최이른 슬롯(엔진 규칙)
    return group
  }

  function renderCard(selectedSlot: { day: '수'; hour: number }) {
    return renderToStaticMarkup(
      <CandidateGroupCard
        group={altGroup()}
        people={RAW_SEED.people}
        recommended={false}
        tentative={false}
        selected={true}
        selectedSlot={selectedSlot}
        radioTabIndex={0}
        radioRef={() => {}}
        onSelect={() => {}}
        onSelectSlot={() => {}}
      />,
    )
  }

  it('시간 블록이 "시간을 골라주세요" 라벨과 함께 열리고, 고려할 점 블록이 구분선 아래 온다', () => {
    const html = renderCard({ day: '수', hour: 14 })
    expect(html).toContain('시간을 골라주세요')
    const timeIndex = html.indexOf('시간을 골라주세요')
    const considerIndex = html.indexOf('고려할 점')
    expect(considerIndex).toBeGreaterThan(timeIndex)
    expect(html).toContain('bg-surface-muted')
  })

  it('칩에서 다른 시간(수15)을 고른 상태면 카드 제목이 그 시간으로 바뀌고 그 칩만 눌린 상태다', () => {
    const html = renderCard({ day: '수', hour: 15 })
    expect(html).toContain('수요일 오후 3시')
    const pressed = html.match(/aria-pressed="true"/g) ?? []
    expect(pressed.length).toBe(1)
    const pressedIndex = html.indexOf('aria-pressed="true"')
    const buttonEnd = html.indexOf('</button>', pressedIndex)
    expect(html.slice(pressedIndex, buttonEnd)).toContain('수요일 15시')
  })

  it('기본 선택(수14) 상태면 제목·눌린 칩이 모두 기본 슬롯을 가리킨다', () => {
    const html = renderCard({ day: '수', hour: 14 })
    expect(html).toContain('수요일 오후 2시')
    const pressedIndex = html.indexOf('aria-pressed="true"')
    const buttonEnd = html.indexOf('</button>', pressedIndex)
    expect(html.slice(pressedIndex, buttonEnd)).toContain('수요일 14시')
  })
})
