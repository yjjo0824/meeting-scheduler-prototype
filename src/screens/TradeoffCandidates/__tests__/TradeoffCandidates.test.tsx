import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { AppProvider } from '../../../state/AppContext'
import { appReducer, buildInitialState } from '../../../state/appReducer'
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

describe('TradeoffCandidates — 응답 후 후보군 3개(seed.expected.candidate_groups_post 재현)', () => {
  const state = appReducer(buildInitialState(), {
    type: 'SUBMIT_RESPONSE',
    personId: 'doyun',
    chips: doyun().response.chips,
  })
  const html = render(state)

  it('"모두가 완벽히 만족하는 시간은 없어요" 안내가 보인다', () => {
    expect(html).toContain('모두가 완벽히 만족하는 시간은 없어요')
    expect(html).toContain('포기하는 항목이 다른 후보를 계산했어요')
  })

  it('추천 후보군: 참석 6/6 · 서연 님 선호 1건 미반영 · 금요일 13시', () => {
    expect(html).toContain('참석 6/6')
    expect(html).toContain('서연 님 선호 1건 미반영')
    expect(html).toContain('금요일 13시')
    expect(html).toContain('추천')
  })

  it('대안 1(접힌 상태): 참석 5/6 · 도윤 님(선택) 제외 문구가 보인다', () => {
    expect(html).toContain('참석 5/6 · 도윤 님(선택) 제외')
    expect(html).toContain('선택 참석자 도윤 님 제외')
  })

  it('대안 2(접힌 상태): 참석 4/6 · 도윤·수아 님(선택) 제외 문구가 보인다', () => {
    expect(html).toContain('참석 4/6 · 도윤·수아 님(선택) 제외')
  })

  it('추천 후보군은 기본으로 펼쳐져 원탭 확정 버튼이 보인다(대안은 접혀 있어 펼쳐야 보임)', () => {
    const matches = html.match(/이 시간으로 확정/g) ?? []
    expect(matches.length).toBe(1)
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
    expect(html).toContain('수요일 14시')
    expect(html).toContain('다른 시간 3개')
    expect(html).toContain('잠정')
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
