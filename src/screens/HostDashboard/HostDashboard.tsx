import { RAW_SEED } from '../../data/loadSeed'
import { useAppState } from '../../state/AppContext'
import { MeetingHeader } from './MeetingHeader'
import { RemindButton } from './RemindButton'
import { ResponseStatusList } from './ResponseStatusList'
import { TentativeRecommendationBanner } from './TentativeRecommendationBanner'

export function HostDashboard() {
  const { state, dispatch, schedule } = useAppState()
  const pendingPerson = state.people.find((p) => !state.hasResponded[p.id]) ?? null
  const respondedCount = state.people.filter((p) => state.hasResponded[p.id]).length

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <MeetingHeader meeting={RAW_SEED.meeting} />
      <p className="text-sm text-slate-500">
        {state.people.length}명 중 {respondedCount}명 응답 완료
      </p>
      <ResponseStatusList
        people={state.people}
        hasResponded={state.hasResponded}
        onSelectPerson={(personId) => dispatch({ type: 'OPEN_PHONE_FRAME', personId })}
      />
      <TentativeRecommendationBanner schedule={schedule} people={state.people} hasResponded={state.hasResponded} />
      <RemindButton
        pendingPersonName={pendingPerson?.name ?? null}
        onClick={() => pendingPerson && dispatch({ type: 'OPEN_PHONE_FRAME', personId: pendingPerson.id })}
      />
    </div>
  )
}
