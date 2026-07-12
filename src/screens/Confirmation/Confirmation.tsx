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
      <ResultSummary meeting={RAW_SEED.meeting} slot={confirmed.slot} />
      <AttendeeList people={state.people} excludedIds={confirmed.excluded} />
      <CalendarRegisteredLabel />
      <ProcedureTransparencyNote />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <RescheduleEntryPoint onClick={() => dispatch({ type: 'REOPEN_FOR_RESCHEDULE' })} />
        {!state.freeModeUnlocked && (
          <FreeModeUnlockButton onClick={() => dispatch({ type: 'UNLOCK_FREE_MODE' })} />
        )}
      </div>
      <RecalcNote />
    </div>
  )
}
