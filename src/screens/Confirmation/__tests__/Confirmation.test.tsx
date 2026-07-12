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
    expect(html).toContain('금요일 오후 1:00–2:00')
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

  it('변수 재계산 안내 문구가 표시된다(§7)', () => {
    expect(html).toContain('변수가 생기면 이 조건들로 다시 계산해드려요')
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

describe('Confirmation — 12C-12: 유일한 행동은 확인 버튼(응답 현황으로 복귀)', () => {
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

  it('하단에 primary "확인" 버튼 하나만 있다 — 다시 조율하기·응답 현황 보기는 없다', () => {
    const html = render(confirmedState())
    expect(html).toContain('>확인</button>')
    expect(html).not.toContain('다시 조율하기')
    expect(html).not.toContain('응답 현황 보기')
    expect(html).not.toContain('← 응답 현황으로')
  })

  it('투어 진행 중에도 확인 버튼이 렌더된다(이동 동선 자체는 숨기지 않음)', () => {
    // buildInitialState는 window 없는 환경에서 tour.active=true — 투어 중 확정에 도달한 상태.
    expect(render(confirmedState())).toContain('>확인</button>')
  })

  it('확인은 history.back()이 아니라 기존 NAVIGATE 액션으로 host에 간다(리듀서 레벨 회귀 확인)', () => {
    const state = confirmedState()
    const after = appReducer(state, { type: 'NAVIGATE', screen: 'host' })
    expect(after.screen).toBe('host')
    // 확정 상태는 유지된다 — 확인은 상태 변경이 아니라 화면 이동일 뿐이다.
    expect(after.confirmedMeeting).not.toBeNull()
  })

  it('투어 활성 상태에서 NAVIGATE를 디스패치해도 tour 상태는 그대로 유지된다(단계가 비정상 종료되지 않음)', () => {
    const state = { ...confirmedState(), tour: { active: true, stepIndex: 3 } }
    const after = appReducer(state, { type: 'NAVIGATE', screen: 'host' })
    expect(after.tour).toEqual({ active: true, stepIndex: 3 })
  })
})
