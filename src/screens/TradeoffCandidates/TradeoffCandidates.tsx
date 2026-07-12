import { useAppState } from '../../state/AppContext'
import type { CandidateGroup } from '../../types/engine'
import { PageContainer } from '../../shared/PageContainer'
import { AlternativeCandidateAccordion } from './AlternativeCandidateAccordion'
import { AskSpecificallyEntry } from './AskSpecificallyEntry'
import { EmptyState } from './EmptyState'
import { OneLineRecommendation } from './OneLineRecommendation'
import { RecommendedCandidateCard } from './RecommendedCandidateCard'

// 트레이드오프 후보 화면(SPEC R2) — 엔진은 유효한 후보군을 모두 계산하고, 화면에는 랭킹 상위
// 2개만 노출한다: 1순위는 추천 카드로 펼치고, 2순위는 "다른 안 보기" 아코디언으로 접는다.
// 확정은 각 후보 카드 내부 CTA로만 한다(라디오 선택·하단 공통 CTA 없음).
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
        onBack={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
        onConfirm={(slot) =>
          dispatch({ type: 'CONFIRM_MEETING', groupKey: topGroup.key, slot, excluded: topGroup.excluded })
        }
      />
    )
  }

  // 표시 레이어 노출 정책(SPEC R2): 랭킹 상위 2개만 — 그보다 낮은 후보군(시드의 월17 등)은
  // 엔진 계산 결과에는 남지만 이 화면에 노출하지 않는다.
  const alternative = rest[0] ?? null
  const visibleCount = alternative ? 2 : 1

  // 그룹 내 시간 선택은 기존 전역 상태(selectedSlotByGroup)를 그대로 쓴다 — 아코디언을 접었다
  // 펴도, 화면을 떠났다 와도 선택이 유지된다. 기본 선택 = 그룹 내 최이른 슬롯(엔진 규칙).
  const slotFor = (group: CandidateGroup) => state.selectedSlotByGroup[group.key] ?? group.defaultSlot
  const confirm = (group: CandidateGroup) =>
    dispatch({ type: 'CONFIRM_MEETING', groupKey: group.key, slot: slotFor(group), excluded: group.excluded })

  // 상태 안내: 미응답자였던 사람(seed 파생 — 도윤)의 답변이 반영된 상태를 한 줄로 알린다.
  const newlyResponded = state.people.filter(
    (p) => p.responded_at_demo_start === false && state.hasResponded[p.id],
  )
  const showArrival = newlyResponded.length > 0 && !anyPending
  const arrivalNames = newlyResponded.map((p) => `${p.name} 님`).join(', ')

  return (
    <PageContainer width="content">
      <div className="relative space-y-section outline-none" data-tour-id="tradeoff-screen" tabIndex={-1}>
        <div>
          {showArrival && (
            <p className="mb-4 flex items-start gap-1.5 text-sm font-bold text-brand-600">
              <span aria-hidden="true">✓</span>
              <span>{arrivalNames}의 답변을 반영했어요</span>
            </p>
          )}
          <h1 className="text-2xl font-bold text-ink-900">추천할 수 있는 시간이 {visibleCount}개 있어요</h1>
          <p className="mt-heading-gap text-sm text-ink-700">
            모두의 조건을 다 맞추기는 어려워요. 참석 인원과 원하는 시간 중 무엇을 지킬지 비교해 보세요.
          </p>
        </div>

        <RecommendedCandidateCard
          group={topGroup}
          people={state.people}
          tentative={anyPending}
          selectedSlot={slotFor(topGroup)}
          onSelectSlot={(slot) => dispatch({ type: 'SELECT_SLOT', groupKey: topGroup.key, slot })}
          onConfirm={() => confirm(topGroup)}
        />

        {alternative && (
          <AlternativeCandidateAccordion
            group={alternative}
            people={state.people}
            selectedSlot={slotFor(alternative)}
            onSelectSlot={(slot) => dispatch({ type: 'SELECT_SLOT', groupKey: alternative.key, slot })}
            onConfirm={() => confirm(alternative)}
          />
        )}

        {/* 자유 모드 보조 도구 — "누군가에게 다시 물어보기" 진입점(노출 조건·동작 현행 유지). */}
        {state.freeModeUnlocked && (
          <div className="flex justify-center">
            <AskSpecificallyEntry />
          </div>
        )}
      </div>
    </PageContainer>
  )
}
