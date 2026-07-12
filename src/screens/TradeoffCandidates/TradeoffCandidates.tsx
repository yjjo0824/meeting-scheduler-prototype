import { useAppState } from '../../state/AppContext'
import { CandidateGroupCard } from './CandidateGroupCard'
import { EmptyState } from './EmptyState'
import { OneLineRecommendation } from './OneLineRecommendation'

export function TradeoffCandidates() {
  const { state, dispatch, schedule } = useAppState()

  if (schedule.groups.length === 0) {
    return <EmptyState />
  }

  const anyPending = state.people.some((p) => !state.hasResponded[p.id])
  const [topGroup, ...rest] = schedule.groups
  const isPerfect = topGroup.cost === 0

  if (isPerfect) {
    return (
      <OneLineRecommendation
        group={topGroup}
        tentative={anyPending}
        onConfirm={(slot) =>
          dispatch({ type: 'CONFIRM_MEETING', groupKey: topGroup.key, slot, excluded: topGroup.excluded })
        }
      />
    )
  }

  const alternatives = rest.slice(0, 2)

  return (
    <div className="relative mx-auto max-w-2xl space-y-6 p-4 sm:p-8" data-tour-id="tradeoff-screen">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">모두가 완벽히 만족하는 시간은 없어요</h1>
        <p className="text-sm text-slate-500">포기하는 항목이 다른 후보를 계산했어요</p>
      </div>

      <CandidateGroupCard
        group={topGroup}
        people={state.people}
        highlighted
        tentative={anyPending}
        showFreeModeExtras={state.freeModeUnlocked}
        selectedSlot={state.selectedSlotByGroup[topGroup.key] ?? topGroup.defaultSlot}
        onSelectSlot={(slot) => dispatch({ type: 'SELECT_SLOT', groupKey: topGroup.key, slot })}
        onConfirm={(slot) =>
          dispatch({ type: 'CONFIRM_MEETING', groupKey: topGroup.key, slot, excluded: topGroup.excluded })
        }
      />

      {alternatives.map((group) => (
        <CandidateGroupCard
          key={group.key}
          group={group}
          people={state.people}
          highlighted={false}
          tentative={anyPending}
          showFreeModeExtras={state.freeModeUnlocked}
          selectedSlot={state.selectedSlotByGroup[group.key] ?? group.defaultSlot}
          onSelectSlot={(slot) => dispatch({ type: 'SELECT_SLOT', groupKey: group.key, slot })}
          onConfirm={(slot) =>
            dispatch({ type: 'CONFIRM_MEETING', groupKey: group.key, slot, excluded: group.excluded })
          }
        />
      ))}
    </div>
  )
}
