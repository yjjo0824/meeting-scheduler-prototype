import { useRef, useState } from 'react'
import { useAppState } from '../../state/AppContext'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { Button } from '../../shared/Button'
import { PageContainer } from '../../shared/PageContainer'
import { CandidateGroupCard } from './CandidateGroupCard'
import { EmptyState } from './EmptyState'
import { OneLineRecommendation } from './OneLineRecommendation'

const ARROW_KEYS = new Set(['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'])

// 순수 함수로 분리 — DOM 없이도 방향키 순환 이동 규칙(다음/이전 + 양 끝 wraparound)을 직접
// 테스트할 수 있게 한다(TourStepCard의 chooseCardPosition과 같은 패턴). 화살표 키가 아니면 null.
export function nextRadioIndex(currentIndex: number, key: string, length: number): number | null {
  if (!ARROW_KEYS.has(key)) return null
  if (length === 0) return null
  const delta = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : -1
  return (currentIndex + delta + length) % length
}

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
        onBack={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
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
  // 이벤트 대상이 실제 role="radio" 버튼일 때만 처리한다 — 그러지 않으면 카드 내부의 시간
  // 선택 버튼(SlotPicker)에서 누른 방향키도 버블링을 타고 올라와 카드 선택을 엉뚱하게
  // 바꿔버린다(12B-4 QA: "카드 내부의 시간 버튼에서 방향키를 눌렀을 때 오작동하면 안 됨").
  function handleRadiogroupKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!(e.target instanceof HTMLElement) || e.target.getAttribute('role') !== 'radio') return
    const currentIndex = visibleGroups.findIndex((g) => g.key === selectedGroup.key)
    const nextIndex = nextRadioIndex(currentIndex, e.key, visibleGroups.length)
    if (nextIndex === null) return
    e.preventDefault()
    const nextGroup = visibleGroups[nextIndex]
    setSelectedGroupKey(nextGroup.key)
    radioRefsRef.current.get(nextGroup.key)?.focus()
  }

  return (
    <PageContainer width="content">
      {/* 보조 뒤로가기 — 투어 중에도 항상 렌더되고 클릭도 막지 않는다(12C-5: 잠금 없는 투어).
          NAVIGATE는 투어 상태(tour.active/stepIndex)를 건드리지 않으므로 단계가 깨지지 않고,
          투어 중 host로 돌아가면 자동 전환 조건(shouldAutoNavigateToTradeoff)이 다시 이 화면으로
          데려온다(투어 진행은 상태 조건으로만 전진 — IMPLEMENTATION_SPEC §3).
          history.back()이 아니라 기존 NAVIGATE 액션을 그대로 재사용한다. */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
        className="text-sm font-medium text-ink-700 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        ← 응답 현황으로
      </button>

      <div className="relative space-y-section outline-none" data-tour-id="tradeoff-screen" tabIndex={-1}>
        <div className="space-y-1">
          <p className="text-sm font-bold text-brand-600">{statusLine}</p>
          <h1 className="text-2xl font-bold text-ink-900">비교할 수 있는 후보가 {visibleCount}개 있어요</h1>
          <p className="text-sm text-ink-700">모두 참석하는 시간과 원하는 시간을 더 지키는 안을 비교해보세요.</p>
        </div>

        {/* 카드 = 비교·선택 전용(카드 내부에 확정 CTA 없음). 확정은 아래 단일 CTA 하나로만 한다.
            roving tabindex: 선택된 카드의 라디오만 tabIndex 0이라 Tab은 그룹당 한 번만 멈춘다 —
            그 안에서는 방향키로 이동·선택한다(네이티브 radiogroup 패턴). */}
        <div role="radiogroup" aria-label="후보 선택" className="space-y-card-gap" onKeyDown={handleRadiogroupKeyDown}>
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
            본문 흐름 안에 두어 콘텐츠를 가리지 않는다(고정 오버레이 아님). 이 화면의 유일한
            primary — HostDashboard의 primary CTA와 같은 공용 Button 규칙(h-control 등)을 쓴다. */}
        <Button
          className="w-full"
          onClick={() =>
            dispatch({
              type: 'CONFIRM_MEETING',
              groupKey: selectedGroup.key,
              slot: selectedSlot,
              excluded: selectedGroup.excluded,
            })
          }
        >
          {formatSlotLabel(selectedSlot)}로 확정하기
        </Button>
      </div>
    </PageContainer>
  )
}
