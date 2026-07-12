import { RAW_SEED } from '../../data/loadSeed'
import { useAppState } from '../../state/AppContext'
import { Card } from '../../shared/Card'
import { PageContainer } from '../../shared/PageContainer'
import { AttendeeList } from './AttendeeList'
import { CalendarRegisteredLabel } from './CalendarRegisteredLabel'
import { ProcedureTransparencyNote } from './ProcedureTransparencyNote'
import { RecalcNote } from './RecalcNote'
import { RescheduleEntryPoint } from './RescheduleEntryPoint'
import { ResultSummary } from './ResultSummary'

export function Confirmation() {
  const { state, dispatch } = useAppState()
  const confirmed = state.confirmedMeeting
  if (!confirmed) return null

  return (
    <PageContainer width="narrow">
      {/* 투어 4단계 대상 — 체험 시작 CTA는 더 이상 이 제품 본문에 없다(TourStepCard 안의
          [체험 시작하기]로 이전됨). tabIndex=-1: 투어 종료 시 여기로 포커스를 되돌릴 수 있게.
          확정 결과는 공통 카드 체계(Card) 위에 얹는다 — HostDashboard 카드와 같은 언어. */}
      <Card data-tour-id="confirmation-summary" tabIndex={-1} className="space-y-5 outline-none">
        <ResultSummary meeting={RAW_SEED.meeting} slot={confirmed.slot} display={RAW_SEED.schedule_display} />
        <AttendeeList people={state.people} excludedIds={confirmed.excluded} />
        <CalendarRegisteredLabel />
        <ProcedureTransparencyNote excludedCount={confirmed.excluded.length} />
      </Card>
      {/* 다시 조율하기 = 화면 이동이 아니라 상태 변경(확정 해제 + 재계산) — 액션 버튼 모양과
          실제 동작이 엇갈려 읽히지 않도록 보조 설명 한 줄을 붙인다(12C-7). */}
      <div className="space-y-1">
        <RescheduleEntryPoint onClick={() => dispatch({ type: 'REOPEN_FOR_RESCHEDULE' })} />
        <p className="text-xs text-ink-500">확정을 해제하고 후보를 다시 계산해요</p>
      </div>
      {/* 주최자 화면으로 이동하는 보조 동선 — 화살표(뒤로가기 관용구)를 떼고 "보기"로 말해
          점프형 이동임을 드러낸다. 투어 중에도 항상 렌더되고 클릭도 막지 않는다(12C-5) —
          NAVIGATE는 투어 상태를 건드리지 않는다. history.back() 미사용. */}
      <div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
          className="text-sm font-medium text-ink-700 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          응답 현황 보기
        </button>
      </div>
      <RecalcNote />
    </PageContainer>
  )
}
