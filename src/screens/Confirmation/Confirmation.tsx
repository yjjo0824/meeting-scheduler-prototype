import { RAW_SEED } from '../../data/loadSeed'
import { useAppState } from '../../state/AppContext'
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
    <div className="mx-auto max-w-xl space-y-5 p-4 sm:p-8">
      {/* 주최자 화면으로 돌아가는 보조 동선 — 내비게이션 톤의 텍스트 버튼이라 "다시 조율하기"와
          위계가 경쟁하지 않는다. 투어 진행 중에는 마지막 단계(카드 안의 [체험 시작하기]) 흐름을
          흩뜨리지 않도록 숨긴다(투어 중 화면 이탈은 Esc로 투어를 먼저 끝내야 가능하다). */}
      {!state.tour.active && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
          className="text-sm font-medium text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-700"
        >
          ← 응답 현황으로
        </button>
      )}
      {/* 투어 4단계 대상 — 체험 시작 CTA는 더 이상 이 제품 본문에 없다(TourStepCard 안의
          [체험 시작하기]로 이전됨). tabIndex=-1: 투어 종료 시 여기로 포커스를 되돌릴 수 있게. */}
      <div data-tour-id="confirmation-summary" tabIndex={-1} className="space-y-5 outline-none">
        <ResultSummary meeting={RAW_SEED.meeting} slot={confirmed.slot} display={RAW_SEED.schedule_display} />
        <AttendeeList people={state.people} excludedIds={confirmed.excluded} />
        <CalendarRegisteredLabel />
        <ProcedureTransparencyNote excludedCount={confirmed.excluded.length} />
      </div>
      <div className="pt-2">
        <RescheduleEntryPoint onClick={() => dispatch({ type: 'REOPEN_FOR_RESCHEDULE' })} />
      </div>
      <RecalcNote />
    </div>
  )
}
