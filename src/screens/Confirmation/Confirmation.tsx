import { RAW_SEED } from '../../data/loadSeed'
import { useAppState } from '../../state/AppContext'
import { AttendeeList } from './AttendeeList'
import { CalendarRegisteredLabel } from './CalendarRegisteredLabel'
import { FreeModeUnlockButton } from './FreeModeUnlockButton'
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
          위계가 경쟁하지 않는다. 투어 진행 중에는 마지막 단계(잠금 해제) 흐름을 흩뜨리지 않도록 숨긴다. */}
      {!state.tour.active && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
          className="text-sm font-medium text-ink-700"
        >
          ← 응답 현황으로
        </button>
      )}
      <ResultSummary meeting={RAW_SEED.meeting} slot={confirmed.slot} display={RAW_SEED.schedule_display} />
      <AttendeeList people={state.people} excludedIds={confirmed.excluded} />
      <CalendarRegisteredLabel />
      <ProcedureTransparencyNote excludedCount={confirmed.excluded.length} />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <RescheduleEntryPoint onClick={() => dispatch({ type: 'REOPEN_FOR_RESCHEDULE' })} />
        {/* 체험 잠금 해제 CTA는 제품 완료 경험의 일부가 아니다 — 가이드 투어가 진행 중일 때만
            투어의 마지막 단계(잠금 해제 유도) 대상으로 남겨둔다. 체험 시작 진입점의 재배치는
            다음 TourOverlay·체험 도구 작업에서 다룬다. */}
        {state.tour.active && !state.freeModeUnlocked && (
          <FreeModeUnlockButton onClick={() => dispatch({ type: 'UNLOCK_FREE_MODE' })} />
        )}
      </div>
      <RecalcNote />
    </div>
  )
}
