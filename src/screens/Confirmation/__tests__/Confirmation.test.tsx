import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { AppProvider } from '../../../state/AppContext'
import { appReducer, buildInitialState } from '../../../state/appReducer'
import { Confirmation } from '../Confirmation'

function render(initialState: ReturnType<typeof buildInitialState>): string {
  return renderToStaticMarkup(
    <AppProvider initialState={initialState}>
      <Confirmation />
    </AppProvider>,
  )
}

describe('Confirmation — IMPLEMENTATION_SPEC §7 필수 표시', () => {
  let state = buildInitialState()
  state = appReducer(state, {
    type: 'CONFIRM_MEETING',
    groupKey: 'k',
    slot: { day: '금', hour: 13 },
    excluded: [],
  })
  const html = render(state)

  it('확정 결과 요약: 날짜·시간·회의명이 표시된다(schedule_display에서 파생)', () => {
    expect(html).toContain('회의 시간이 확정됐어요')
    expect(html).toContain(RAW_SEED.meeting.title)
    expect(html).toContain('7월 17일(금) 오후 1:00–2:00')
  })

  it('참석자 명단이 표시된다(제외자 없음)', () => {
    for (const p of RAW_SEED.people) expect(html).toContain(p.name)
    expect(html).not.toContain('이번엔 함께하지 못해요')
  })

  it('캘린더 등록 라벨이 표시된다', () => {
    expect(html).toContain('참석자 캘린더에 등록했어요')
  })

  it('절차 투명성 수준의 문구만 표시되고, 누구의 무엇을 포기했는지는 재노출되지 않는다', () => {
    expect(html).toContain('전원 참석 가능한 시간 기준으로 정해졌어요')
    expect(html).not.toContain('선호')
    expect(html).not.toContain('미반영')
  })

  it('다시 조율하기 진입점과 재계산 안내 문구가 표시된다', () => {
    expect(html).toContain('다시 조율하기')
    expect(html).toContain('일정이 바뀌면 지금까지 모은 조건으로 다시 계산할 수 있어요')
  })

  it('제품 본문에는 "직접 사용해보세요" 버튼이 어떤 투어 상태에서도 남아있지 않다(12B-2: CTA가 투어 카드 안으로 이전됨)', () => {
    expect(html).not.toContain('직접 사용해보세요')
  })

  it('투어가 비활성이어도(모바일 시작 등) 제품 본문에는 여전히 그 버튼이 없다', () => {
    const html2 = render({
      ...appReducer(buildInitialState(), {
        type: 'CONFIRM_MEETING',
        groupKey: 'k',
        slot: { day: '금', hour: 13 },
        excluded: [],
      }),
      tour: { active: false, stepIndex: 3 },
    })
    expect(html2).not.toContain('직접 사용해보세요')
  })

  it('확정 결과 요약 영역이 투어 4단계 대상(data-tour-id)과 프로그램적 포커스가 가능한 tabIndex를 갖는다', () => {
    expect(html).toContain('data-tour-id="confirmation-summary"')
    expect(html).toContain('tabindex="-1"')
  })
})

describe('Confirmation — 제외자가 있는 경우', () => {
  it('제외된 참여자가 명단에 별도로 표시된다', () => {
    let state = buildInitialState()
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: 'k',
      slot: { day: '수', hour: 14 },
      excluded: ['doyun'],
    })
    const html = render(state)

    expect(html).toContain('이번엔 함께하지 못해요')
    expect(html).toContain('도윤')
  })
})

describe('Confirmation — 응답 현황으로 돌아가는 보조 동선(12B QA 항목 2)', () => {
  function confirmedState() {
    let state = buildInitialState()
    state = appReducer(state, {
      type: 'CONFIRM_MEETING',
      groupKey: 'k',
      slot: { day: '금', hour: 13 },
      excluded: [],
    })
    return state
  }

  it('투어가 끝난 뒤(자유 조회)에는 "응답 현황으로" 버튼이 보인다', () => {
    const state = confirmedState()
    const html = render({ ...state, tour: { ...state.tour, active: false } })
    expect(html).toContain('응답 현황으로')
  })

  it('투어 진행 중에는 마지막 단계 흐름을 방해하지 않도록 숨긴다', () => {
    // buildInitialState는 window 없는 환경에서 tour.active=true — 투어 중 확정에 도달한 상태.
    const html = render(confirmedState())
    expect(html).not.toContain('응답 현황으로')
  })
})
