import { useRef, useState } from 'react'
import { useAppState } from '../../state/AppContext'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { CandidateGroupCard } from './CandidateGroupCard'
import { EmptyState } from './EmptyState'
import { OneLineRecommendation } from './OneLineRecommendation'

const ARROW_KEYS = new Set(['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'])

export function TradeoffCandidates() {
  const { state, dispatch, schedule } = useAppState()
  // 후보군 선택은 이 화면 안의 비교 과정일 뿐이라 로컬 상태로 둔다(확정 전에는 전역에 남길 이유가
  // 없음). 최초 선택 = 추천 후보군. 그룹 안의 시간 선택은 기존 SELECT_SLOT 전역 액션을 그대로 쓴다.
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  // roving tabindex 대상 포커스 이동에 쓴다 — 방향키로 선택이 바뀌면 그 카드의 라디오 버튼으로
  // 포커스도 함께 옮긴다(네이티브 radiogroup과 동일한 체감).
  const radioRefsRef = useRef(new Map<string, HTMLButtonElement>())

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

  // 방향키(위/아래 또는 좌/우 — 어느 축이든 동일하게 다음/이전으로 다룬다) 이동: 네이티브
  // radiogroup처럼 이동이 곧 선택 변경이다. 그룹 안 시간 선택 시 그 후보가 자동 선택되는 기존
  // 동작과 같은 원리 — "포커스된 후보 = 선택된 후보"를 항상 유지한다.
  function handleRadiogroupKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!ARROW_KEYS.has(e.key)) return
    e.preventDefault()
    const currentIndex = visibleGroups.findIndex((g) => g.key === selectedGroup.key)
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (currentIndex + delta + visibleGroups.length) % visibleGroups.length
    const nextGroup = visibleGroups[nextIndex]
    setSelectedGroupKey(nextGroup.key)
    radioRefsRef.current.get(nextGroup.key)?.focus()
  }

  return (
    <div
      className="relative mx-auto max-w-2xl space-y-6 p-4 outline-none sm:p-8"
      data-tour-id="tradeoff-screen"
      tabIndex={-1}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-indigo-600">{statusLine}</p>
        <h1 className="text-lg font-semibold text-slate-900">비교할 수 있는 후보가 {visibleCount}개 있어요</h1>
        <p className="text-sm text-slate-500">모두 참석하는 시간과 원하는 시간을 더 지키는 안을 비교해보세요.</p>
      </div>

      {/* 카드 = 비교·선택 전용(카드 내부에 확정 CTA 없음). 확정은 아래 단일 CTA 하나로만 한다.
          roving tabindex: 선택된 카드의 라디오만 tabIndex 0이라 Tab은 그룹당 한 번만 멈춘다 —
          그 안에서는 방향키로 이동·선택한다(네이티브 radiogroup 패턴). */}
      <div role="radiogroup" aria-label="후보 선택" className="space-y-4" onKeyDown={handleRadiogroupKeyDown}>
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
            radioTabIndex={group.key === selectedGroup.key ? 0 : -1}
            radioRef={(el) => {
              if (el) radioRefsRef.current.set(group.key, el)
              else radioRefsRef.current.delete(group.key)
            }}
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
        className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        {formatSlotLabel(selectedSlot)}로 확정하기
      </button>
    </div>
  )
}
