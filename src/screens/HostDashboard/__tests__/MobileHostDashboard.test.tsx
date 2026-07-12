import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { AppProvider } from '../../../state/AppContext'
import { buildInitialState } from '../../../state/appReducer'
import { MobileHostDashboard, type MobileView } from '../MobileHostDashboard'

function render(
  stateOverride?: Partial<ReturnType<typeof buildInitialState>>,
  view: MobileView = 'list',
  selectedPersonId: string | null = null,
) {
  const initialState = { ...buildInitialState(), ...stateOverride }
  return renderToStaticMarkup(
    <AppProvider initialState={initialState}>
      <MobileHostDashboard
        selectedPersonId={selectedPersonId}
        onSelectPerson={() => {}}
        view={view}
        onChangeView={() => {}}
        selectedDay={RAW_SEED.grid.days[0]}
        onSelectDay={() => {}}
      />
    </AppProvider>,
  )
}

// 12C-7: view/selectedDay 상태는 부모(HostDashboard)가 소유하고 이 컴포넌트는 props로 받는
// 제어 컴포넌트다 — 그래서 SSR로도 임의의 view를 주입해 각 화면을 직접 검증할 수 있게 됐다.
// detail/days 화면의 세부 내용은 각각 재사용하는 PersonDetailPanel과
// MobileDayTabs·MobileDayCompareGrid의 기존 테스트가 이미 커버한다.
describe('MobileHostDashboard — 좁은 화면 첫 화면(list)', () => {
  it('회의명·응답 현황·리마인드·잠정 추천·참여자 목록·요일별 비교 진입이 모두 표시된다', () => {
    const html = render()
    expect(html).toContain(RAW_SEED.meeting.title)
    expect(html).toContain('도윤 님의 답변을 기다리고 있어요')
    expect(html).toContain('data-tour-id="remind-button"')
    expect(html).toContain('현재 가장 좋은 시간이에요')
    expect(html).toContain('참여자 (6)')
    expect(html).toContain('요일별 시간 보기')
  })

  it('실제 제품 화면에는 참여자 응답 화면(폰 프레임) 진입 CTA가 없다(항목 4)', () => {
    const html = render()
    expect(html).not.toContain('참여자 화면 보기')
    expect(html).not.toContain('평가용 기능이에요')
    expect(html).not.toContain('참여자로 체험하기')
  })

  it('도윤의 원문·사유(cue)는 어디에도 노출되지 않는다(R4)', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const html = render()
    expect(html).not.toContain(doyun.response.raw!)
    for (const chip of doyun.response.chips) {
      if (chip.cue) expect(html).not.toContain(chip.cue)
    }
  })
})

describe('MobileHostDashboard — 상태 기반 결과 CTA(기존 NAVIGATE 액션 재사용)', () => {
  it('확정 전에는 "후보 시간 비교하기"만 보이고 "확정 결과 보기"는 없다', () => {
    const html = render()
    expect(html).toContain('후보 시간 비교하기')
    expect(html).not.toContain('확정 결과 보기')
  })

  it('확정 후에는 "확정 결과 보기"만 보이고 "후보 시간 비교하기"는 없다', () => {
    const html = render({
      confirmedMeeting: { groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] },
    })
    expect(html).toContain('확정 결과 보기')
    expect(html).not.toContain('후보 시간 비교하기')
  })
})

describe('MobileHostDashboard — 미응답자가 없으면 리마인드 카드가 사라진다', () => {
  it('전원 응답 완료 상태에서는 리마인드 카드가 렌더되지 않는다', () => {
    const state = buildInitialState()
    const allResponded = Object.fromEntries(RAW_SEED.people.map((p) => [p.id, true]))
    const html = render({ hasResponded: allResponded, people: state.people })
    expect(html).not.toContain('님의 답변을 기다리고 있어요')
  })
})

describe('MobileHostDashboard — 12C-7: 뷰 상태가 언마운트를 살아남는다(days → 데스크톱 폭 → 모바일 폭 → days 유지)', () => {
  it('view="days"를 주입하면 요일별 시간 보기 화면이 렌더된다(제어 컴포넌트 — 부모 상태가 곧 화면)', () => {
    const html = render(undefined, 'days')
    expect(html).toContain('요일별 시간 보기')
    expect(html).toContain('← 목록으로')
    // 요일 탭이 전부 렌더된다(탭 라벨은 "월"/"화" 단독 표기).
    for (const day of RAW_SEED.grid.days) expect(html).toContain(`>${day}<`)
  })

  it('view="detail" + 선택 참여자를 주입하면 상세 화면이 렌더된다', () => {
    const html = render(undefined, 'detail', 'haneul')
    expect(html).toContain('← 목록으로')
    expect(html).toContain('하늘')
  })

  it('뷰 상태의 소유자는 언마운트되지 않는 HostDashboard다(소스 레벨 회귀 가드)', () => {
    // 재현 시퀀스(days → 데스크톱 폭 → 모바일 폭)는 리사이즈에 따른 마운트/언마운트가 필요해
    // SSR로 재현할 수 없다(프로젝트 공통 한계). 대신 버그의 구조적 원인("언마운트되는
    // MobileHostDashboard가 view 상태를 로컬로 소유")이 되살아나지 않도록 소스 레벨로 고정한다:
    // useState<MobileView>는 브레이크포인트 전환에도 마운트가 유지되는 HostDashboard에만 있다.
    const hostSource = readFileSync(fileURLToPath(new URL('../HostDashboard.tsx', import.meta.url)), 'utf-8')
    const mobileSource = readFileSync(
      fileURLToPath(new URL('../MobileHostDashboard.tsx', import.meta.url)),
      'utf-8',
    )
    expect(hostSource).toContain('useState<MobileView>')
    expect(mobileSource).not.toContain('useState')
  })
})

describe('MobileHostDashboard — 참석 어려움 신고 알림(12B QA 항목 3)', () => {
  it('확정 후 신고가 있으면 모바일 첫 화면에도 알림과 확정 결과 진입 CTA가 보인다', () => {
    const html = render({
      confirmedMeeting: { groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] },
      reportedByPersonId: { seoyeon: true },
    })
    expect(html).toContain('서연 님이 확정된 시간에 참석하기 어렵다고 알려왔어요')
    expect(html).toContain('확정 결과 확인하기')
  })

  it('모바일 참여자 목록의 신고자 행에 "참석 어려움 알림" 배지가 붙는다', () => {
    const html = render({
      confirmedMeeting: { groupKey: 'k', slot: { day: '금', hour: 13 }, excluded: [] },
      reportedByPersonId: { seoyeon: true },
    })
    const rowStart = html.indexOf('서연', html.indexOf('참여자 (6)'))
    const rowEnd = html.indexOf('</button>', rowStart)
    expect(html.slice(rowStart, rowEnd)).toContain('참석 어려움 알림')
  })

  it('확정이 풀리면 신고 배지도 사라진다', () => {
    const html = render({ reportedByPersonId: { seoyeon: true } })
    expect(html).not.toContain('참석 어려움 알림')
  })
})
