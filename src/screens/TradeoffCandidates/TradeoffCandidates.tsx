import { useState } from 'react'
import { useAppState } from '../../state/AppContext'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { CandidateGroupCard } from './CandidateGroupCard'
import { EmptyState } from './EmptyState'
import { OneLineRecommendation } from './OneLineRecommendation'

export function TradeoffCandidates() {
  const { state, dispatch, schedule } = useAppState()
  // 후보군 선택은 이 화면 안의 비교 과정일 뿐이라 로컬 상태로 둔다(확정 전에는 전역에 남길 이유가
  // 없음). 최초 선택 = 추천 후보군. 그룹 안의 시간 선택은 기존 SELECT_SLOT 전역 액션을 그대로 쓴다.
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)

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
  const visibleGroups = [topGroup, ...alternatives]
  const visibleCount = visibleGroups.length

  // 자유 모드에서 조건이 바뀌어 그룹 구성이 달라졌으면 선택을 추천으로 되돌린다(존재하지 않는
  // 그룹 키가 남지 않도록).
  const selectedGroup = visibleGroups.find((g) => g.key === selectedGroupKey) ?? topGroup
  const selectedSlot = state.selectedSlotByGroup[selectedGroup.key] ?? selectedGroup.defaultSlot

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

      {/* 카드 = 비교·선택 전용(카드 내부에 확정 CTA 없음). 확정은 아래 단일 CTA 하나로만 한다. */}
      <div role="radiogroup" aria-label="후보 선택" className="space-y-4">
        {visibleGroups.map((group, index) => (
          <CandidateGroupCard
            key={group.key}
            group={group}
            people={state.people}
            recommended={index === 0}
            tentative={anyPending}
            selected={group.key === selectedGroup.key}
            showFreeModeExtras={state.freeModeUnlocked}
            selectedSlot={state.selectedSlotByGroup[group.key] ?? group.defaultSlot}
            onSelect={() => setSelectedGroupKey(group.key)}
            onSelectSlot={(slot) => {
              // 그룹 안의 시간을 고르면 그 후보군이 곧 현재 선택 후보가 된다.
              dispatch({ type: 'SELECT_SLOT', groupKey: group.key, slot })
              setSelectedGroupKey(group.key)
            }}
          />
        ))}
      </div>

      {/* 화면 하단 단일 확정 CTA — 선택한 후보·시간이 바뀌면 문구가 즉시 갱신된다.
          본문 흐름 안에 두어 콘텐츠를 가리지 않는다(고정 오버레이 아님). */}
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'CONFIRM_MEETING',
            groupKey: selectedGroup.key,
            slot: selectedSlot,
            excluded: selectedGroup.excluded,
          })
        }
        className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white"
      >
        {formatSlotLabel(selectedSlot)}로 확정하기
      </button>
    </div>
  )
}
