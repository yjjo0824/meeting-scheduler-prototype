import { useRef, useState } from 'react'
import { useAppState } from '../../state/AppContext'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { Button } from '../../shared/Button'
import { PageContainer } from '../../shared/PageContainer'
import { AskSpecificallyEntry } from './AskSpecificallyEntry'
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

  // 재계산 배너(12C-12): 미응답자였던 사람(seed에서 파생 — 도윤)의 응답이 제출되어 재계산된
  // 직후에만 보여준다. 이름은 해당 응답자에서 파생(하드코딩 금지). 자유 모드(freeModeUnlocked)
  // 에서는 표시하지 않는다 — 칩 수정·필수/선택 변경 재계산은 전부 자유 모드에서만 일어나므로,
  // 이 게이트 하나가 "그런 재계산에는 표시하지 않음" 규칙을 상태 추가 없이 보장한다(투어가
  // 끝나면 과거 이벤트가 된 배너도 자연히 내려간다 — "직후에만"과 정합).
  const newlyResponded = state.people.filter(
    (p) => p.responded_at_demo_start === false && state.hasResponded[p.id],
  )
  const showRecalcBanner = newlyResponded.length > 0 && !anyPending && !state.freeModeUnlocked
  const recalcBannerNames = newlyResponded.map((p) => `${p.name} 님`).join(', ')

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
    // pb-28: 하단 고정 플로팅 확정 CTA가 마지막 카드의 "고려할 점"을 가리지 않도록 여백을 확보한다.
    <PageContainer width="content" className="pb-28">
      {/* 보조 뒤로가기(12C-12.1 복원) — 투어 중에도 렌더되고 클릭도 막지 않는다(12C-5: 잠금 없는
          투어). NAVIGATE는 투어 상태를 건드리지 않으며, 투어 중 host로 가면 자동 전환 조건
          (shouldAutoNavigateToTradeoff)이 즉시 이 화면으로 되돌린다 — 버그가 아니라 "투어 진행은
          상태 조건으로만 전진"하는 설계다(IMPLEMENTATION_SPEC §3). 투어 종료 후에는 정상 이동한다.
          history.back()이 아니라 기존 NAVIGATE 액션을 그대로 재사용한다. */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
        className="text-sm font-medium text-ink-700 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        ← 응답 현황으로
      </button>

      <div className="relative space-y-section outline-none" data-tour-id="tradeoff-screen" tabIndex={-1}>
        {showRecalcBanner && (
          // 인라인 체크 메시지 톤(12D-2, 참고안 arrival 패턴) — 카피·표시 조건은 현행 유지.
          <p className="flex items-start gap-1.5 text-sm font-bold text-brand-600">
            <span aria-hidden="true">✓</span>
            <span>{recalcBannerNames}이 캘린더에 없던 일정을 알려줘서, 추천 시간을 다시 계산했어요.</span>
          </p>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ink-900">조건이 다른 안 {visibleCount}개를 찾았어요</h1>
          <p className="text-sm text-ink-700">
            모두의 조건을 다 맞추기는 어려워요. 참석 인원과 원하는 시간 중 무엇을 지킬지 비교해 보세요.
          </p>
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

        {/* 목록 아래 중앙 보조 도구(12D-2, 참고안 배치) — "누군가에게 다시 물어보기"는 카드 안에
            있던 진입점의 화면 레벨 승격(12C-12)이라 노출 조건(자유 모드)·동작도 그대로다. */}
        {state.freeModeUnlocked && (
          <div className="flex justify-center">
            <AskSpecificallyEntry />
          </div>
        )}

        {/* 하단 고정 플로팅 확정 CTA(12C-12) — 선택한 후보·시간이 바뀌면 라벨이 즉시 갱신된다.
            중앙 정렬 + 최대 폭 제한으로 우측 하단 pill 스택(right-4, z-700)과 데스크톱에서
            겹치지 않고, 640px 미만에서는 우측 여백을 예약해 다시 보기 pill을 피한다.
            이 화면의 유일한 primary — 공용 Button 규칙(h-control 등)을 그대로 쓴다. */}
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[600] flex justify-center pl-4 pr-[9.75rem] sm:px-4">
          <Button
            className="pointer-events-auto w-full max-w-sm shadow-elevated"
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
      </div>
    </PageContainer>
  )
}
