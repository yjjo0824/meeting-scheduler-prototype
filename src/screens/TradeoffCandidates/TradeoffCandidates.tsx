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
  const visibleCount = 1 + alternatives.length

  // 상태 문구: 데모 시작 시점에 미응답이었다가 응답한 사람(seed에서 파생 — 도윤)이 있으면 그 사람의
  // 응답이 방금 반영됐음을 말해준다. 아니면 취합 현황으로 일반화한다(하드코딩 금지).
  const newlyResponded = state.people.filter(
    (p) => p.responded_at_demo_start === false && state.hasResponded[p.id],
  )
  const respondedCount = state.people.filter((p) => state.hasResponded[p.id]).length
  const statusLine =
    newlyResponded.length > 0 && !anyPending
      ? `${newlyResponded.map((p) => `${p.name} 님`).join(', ')}의 응답을 반영했어요`
      : `${state.people.length}명 중 ${respondedCount}명의 응답을 반영했어요`

  return (
    <div className="relative mx-auto max-w-2xl space-y-6 p-4 sm:p-8" data-tour-id="tradeoff-screen">
      <div className="space-y-1">
        <p className="text-xs font-medium text-indigo-600">{statusLine}</p>
        <h1 className="text-lg font-semibold text-slate-900">비교할 수 있는 후보가 {visibleCount}개 있어요</h1>
        <p className="text-sm text-slate-500">모두 참석하는 시간과 원하는 시간을 더 지키는 안을 비교해보세요.</p>
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
