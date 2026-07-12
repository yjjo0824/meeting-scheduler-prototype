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
      {/* 주최자 화면으로 돌아가는 보조 동선 — 내비게이션 톤의 텍스트 버튼이라 "다시 조율하기"와
          위계가 경쟁하지 않는다. 투어 중에도 항상 렌더한다(12B-4 QA: 뒤로가기 동선 자체는 보여야
          함) — confirmation-summary 대상 바깥(형제)에 있어 다른 비대상 요소처럼 useTourInert가
          자동으로 inert 처리하므로, 눌러도 투어 상태(tour.active/stepIndex)를 건드리지 않는다.
          history.back()이 아니라 기존 NAVIGATE 액션을 그대로 재사용한다. */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
        className="text-sm font-medium text-ink-700 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        ← 응답 현황으로
      </button>
      {/* 투어 4단계 대상 — 체험 시작 CTA는 더 이상 이 제품 본문에 없다(TourStepCard 안의
          [체험 시작하기]로 이전됨). tabIndex=-1: 투어 종료 시 여기로 포커스를 되돌릴 수 있게.
          확정 결과는 공통 카드 체계(Card) 위에 얹는다 — HostDashboard 카드와 같은 언어. */}
      <Card data-tour-id="confirmation-summary" tabIndex={-1} className="space-y-5 outline-none">
        <ResultSummary meeting={RAW_SEED.meeting} slot={confirmed.slot} display={RAW_SEED.schedule_display} />
        <AttendeeList people={state.people} excludedIds={confirmed.excluded} />
        <CalendarRegisteredLabel />
        <ProcedureTransparencyNote excludedCount={confirmed.excluded.length} />
      </Card>
      <div className="space-y-2">
        <RescheduleEntryPoint onClick={() => dispatch({ type: 'REOPEN_FOR_RESCHEDULE' })} />
        <RecalcNote />
      </div>
    </PageContainer>
  )
}
