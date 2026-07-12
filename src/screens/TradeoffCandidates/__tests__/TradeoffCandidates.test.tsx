import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { computeSchedule } from '../../../engine/computeSchedule'
import { AppProvider } from '../../../state/AppContext'
import { appReducer, buildInitialState } from '../../../state/appReducer'
import { AlternativeCandidateAccordion } from '../AlternativeCandidateAccordion'
import { TradeoffCandidates } from '../TradeoffCandidates'

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

function respondedState() {
  return appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
}

describe('TradeoffCandidates — 상위 2개 노출 정책(SPEC R2, seed.expected.candidate_groups_post 기반)', () => {
  const html = render(respondedState())

  it('상태 안내: "✓ 도윤 님의 답변을 반영했어요"가 제목 위 한 줄로 표시된다(이름은 상태 파생)', () => {
    const arrivalIndex = html.indexOf('도윤 님의 답변을 반영했어요')
    const titleIndex = html.indexOf('추천할 수 있는 시간이 2개 있어요')
    expect(arrivalIndex).toBeGreaterThan(-1)
    expect(arrivalIndex).toBeLessThan(titleIndex)
    expect(html).toContain('✓')
  })

  it('제목·설명이 새 카피로 표시된다(N은 노출 후보 수에서 파생)', () => {
    expect(html).toContain('추천할 수 있는 시간이 2개 있어요')
    expect(html).toContain('모두의 조건을 다 맞추기는 어려워요. 참석 인원과 원하는 시간 중 무엇을 지킬지 비교해 보세요.')
  })

  it('엔진은 후보군 3개를 그대로 계산하지만, 화면에는 상위 2개만 노출된다(월17 비노출)', () => {
    const schedule = computeSchedule(RAW_SEED, RAW_SEED.people)
    expect(schedule.groups.length).toBe(3)
    // 3순위(월요일 오후 5시 · 도윤·수아 제외)는 화면에 없다.
    expect(html).not.toContain('월요일 오후 5시')
    expect(html).not.toContain('수아 님')
  })

  it('추천 카드: 배지 → 큰 시간 → 핵심 설명 → 지표 2개 → 고려할 점 → 카드 내부 CTA 순서', () => {
    const badge = html.indexOf('>추천<')
    const time = html.indexOf('금요일 오후 1시')
    const summary = html.indexOf('6명 모두 참석할 수 있어요')
    // 헤더 설명문에도 "참석 인원"/"원하는 시간"이 등장하므로 카드 요약 이후 위치에서 찾는다.
    const metric1 = html.indexOf('참석 인원', summary)
    const metric2 = html.indexOf('원하는 시간', metric1 + 1)
    const consider = html.indexOf('고려할 점')
    const cta = html.indexOf('이 시간으로 확정하기')
    expect(badge).toBeGreaterThan(-1)
    expect(time).toBeGreaterThan(badge)
    expect(summary).toBeGreaterThan(time)
    expect(metric1).toBeGreaterThan(summary)
    expect(metric2).toBeGreaterThan(metric1)
    expect(consider).toBeGreaterThan(metric2)
    expect(cta).toBeGreaterThan(consider)
  })

  it('추천 카드 지표 값: 참석 6 / 6명 · 원하는 시간 5 / 6명 충족(엔진 파생)', () => {
    expect(html).toContain('6 / 6명')
    expect(html).toContain('5 / 6명 충족')
  })

  it('고려할 점: "서연 님이 가급적 피하고 싶은 시간이에요."(주체 명시 — R2)', () => {
    expect(html).toContain('서연 님이 가급적 피하고 싶은 시간이에요.')
  })

  it('추천 카드는 흰 배경 + 파란 2px 테두리(선택 라디오·파란 전체 배경 없음)', () => {
    expect(html).toContain('border-2 border-brand-500')
    expect(html).not.toContain('role="radio"')
    expect(html).not.toContain('bg-state-selected-soft')
  })

  it('다른 안 아코디언: 기본 접힘 — 제목·요약·aria 배선만 있고 상세는 렌더되지 않는다', () => {
    expect(html).toContain('다른 안 보기')
    expect(html).toContain('수요일 오후 2시 · 5명 참석 · 모두가 원하는 시간')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls="alternative-candidate-detail"')
    // 접힌 상태에서는 상세(시간 선택·지표·고려할 점·CTA)가 DOM에 없다.
    expect(html).not.toContain('id="alternative-candidate-detail"')
    expect(html).not.toContain('시간을 골라주세요')
    expect(html).not.toContain('선택 참석자인 도윤 님은 참석하지 않아요.')
  })

  it('확정 CTA는 후보 카드 내부에만 있다 — 기본 상태(다른 안 접힘)에서 정확히 1개, 하단 고정 공통 CTA 없음', () => {
    const ctas = html.match(/이 시간으로 확정하기/g) ?? []
    expect(ctas.length).toBe(1)
    expect(html).not.toContain('로 확정하기</button></div></div>')
    // 이전 구조의 흔적이 없다.
    expect(html).not.toContain('금요일 오후 1시로 확정하기')
    expect(html).not.toContain('← 응답 현황으로')
    expect(html).not.toContain('조건이 다른 안')
    expect(html).not.toContain('다시 계산했어요')
  })

  it('중복 참석 정보("참석 6/6" 꼬리표)와 cost 숫자는 노출되지 않는다', () => {
    expect(html).not.toContain('참석 6/6')
    expect(html).not.toContain('>2<')
    expect(html).not.toContain('>3<')
  })

  it('내부 용어(트레이드오프·포기·미반영)는 사용자 화면에 노출되지 않는다', () => {
    expect(html).not.toContain('트레이드오프')
    expect(html).not.toContain('포기')
    expect(html).not.toContain('미반영')
  })

  it('투어 3단계 타깃(data-tour-id="tradeoff-screen")은 유지된다', () => {
    expect(html).toContain('data-tour-id="tradeoff-screen"')
  })

  it('"누군가에게 다시 물어보기"는 자유 모드에서만 보인다(현행 유지)', () => {
    expect(html).not.toContain('누군가에게 다시 물어보기')
    const freeModeHtml = render(appReducer(respondedState(), { type: 'UNLOCK_FREE_MODE' }))
    expect(freeModeHtml).toContain('누군가에게 다시 물어보기')
  })
})

describe('AlternativeCandidateAccordion — 펼친 상태(직접 렌더, SSR은 클릭 토글 불가)', () => {
  function altGroup() {
    const schedule = computeSchedule(RAW_SEED, RAW_SEED.people)
    const group = schedule.groups[1]
    expect(group.defaultSlot).toEqual({ day: '수', hour: 14 }) // 기본 선택 = 그룹 내 최이른 슬롯
    return group
  }

  function renderExpanded(selectedSlot: { day: '수'; hour: number }) {
    return renderToStaticMarkup(
      <AlternativeCandidateAccordion
        group={altGroup()}
        people={RAW_SEED.people}
        selectedSlot={selectedSlot}
        onSelectSlot={() => {}}
        onConfirm={() => {}}
        initialExpanded
      />,
    )
  }

  it('펼치면 시간 4개 선택·지표·고려할 점·CTA가 모두 보인다(값은 엔진 파생)', () => {
    const html = renderExpanded({ day: '수', hour: 14 })
    expect(html).toContain('다른 안 접기')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('id="alternative-candidate-detail"')
    expect(html).toContain('시간을 골라주세요')
    const pressed = html.match(/aria-pressed/g) ?? []
    expect(pressed.length).toBe(4) // 수14~17 — 숨는 게 1개뿐이면 전부 노출(기존 규칙)
    expect(html).toContain('5 / 6명')
    expect(html).toContain('참석하는 5명 모두 충족')
    expect(html).toContain('선택 참석자인 도윤 님은 참석하지 않아요.')
    expect(html).toContain('이 시간으로 확정하기')
  })

  it('기본 선택은 최이른 슬롯(수14)이고, 선택 시간이 바뀌면 그 칩만 눌린 상태가 된다', () => {
    const at14 = renderExpanded({ day: '수', hour: 14 })
    const idx14 = at14.indexOf('aria-pressed="true"')
    expect(at14.slice(idx14, at14.indexOf('</button>', idx14))).toContain('수요일 14시')

    const at15 = renderExpanded({ day: '수', hour: 15 })
    expect((at15.match(/aria-pressed="true"/g) ?? []).length).toBe(1)
    const idx15 = at15.indexOf('aria-pressed="true"')
    expect(at15.slice(idx15, at15.indexOf('</button>', idx15))).toContain('수요일 15시')
    // 접힌 요약도 현재 선택 시간을 따라간다(닫아도 선택 상태 유지 — 전역 selectedSlotByGroup).
    expect(at15).toContain('수요일 오후 3시 · 5명 참석 · 모두가 원하는 시간')
  })

  it('CTA 확정은 리듀서 레벨에서 현재 선택 시각을 확정한다(수15로 확정 → Confirmation 이동)', () => {
    let state = respondedStateForReducer()
    const group = altGroup()
    state = appReducer(state, { type: 'SELECT_SLOT', groupKey: group.key, slot: { day: '수', hour: 15 } })
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: group.key,
      slot: state.selectedSlotByGroup[group.key],
      excluded: group.excluded,
    })
    expect(state.confirmedMeeting).toEqual({ groupKey: group.key, slot: { day: '수', hour: 15 }, excluded: ['doyun'] })
    expect(state.screen).toBe('confirmation')
  })

  function respondedStateForReducer() {
    return appReducer(buildInitialState(), {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: doyun().response.chips,
    })
  }
})

describe('TradeoffCandidates — 추천 CTA 확정 연결(리듀서 레벨)', () => {
  it('추천안 확정: 금요일 오후 1시가 확정되고 Confirmation으로 이동한다', () => {
    const schedule = computeSchedule(RAW_SEED, RAW_SEED.people)
    const top = schedule.groups[0]
    let state = appReducer(buildInitialState(), {
      type: 'SUBMIT_RESPONSE',
      personId: 'doyun',
      chips: doyun().response.chips,
    })
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: top.key,
      slot: top.defaultSlot,
      excluded: top.excluded,
    })
    expect(state.confirmedMeeting?.slot).toEqual({ day: '금', hour: 13 })
    expect(state.screen).toBe('confirmation')
  })
})

describe('TradeoffCandidates — 한 줄 모드(완벽 슬롯 존재 + 잠정 배지, 기존 유지)', () => {
  it('응답 전 상태(도윤 미응답)로 렌더링하면 한 줄 모드 + 잠정 배지가 보인다', () => {
    const html = render(buildInitialState())
    expect(html).toContain('모두 괜찮은 시간이 있어요')
    expect(html).toContain('수요일 오후 2시')
    expect(html).toContain('다른 시간 3개')
    expect(html).toContain('잠정')
    expect(html).toContain('수요일 오후 2시로 확정하기')
  })
})

describe('TradeoffCandidates — 빈 상태(기존 유지)', () => {
  it('필수 참석자 한 명이 격자 전체를 막으면 후보 슬롯이 0개가 되어 안내 문구가 보인다', () => {
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
