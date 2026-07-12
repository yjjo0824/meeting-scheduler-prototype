import { useState } from 'react'
import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { Button } from '../../shared/Button'
import { CandidateComparison, ConsiderationNote } from './CandidateComparison'
import { SlotPicker } from './SlotPicker'

interface Props {
  group: CandidateGroup
  people: Person[]
  selectedSlot: Slot
  onSelectSlot: (slot: Slot) => void
  onConfirm: () => void
  // 테스트 전용: 펼친 상태 구조를 SSR로 검증하기 위한 초기값(제품 기본은 접힘).
  initialExpanded?: boolean
}

const CONTENT_ID = 'alternative-candidate-detail'

// 다른 안(2순위, SPEC R2) — 기본은 한 줄 아코디언으로 접혀 있고, 눌러 펼치면 같은 후보군의
// 상세(시간 선택·비교 지표·고려할 점·확정 CTA)가 열린다. 추천 카드보다 시각 강조가 낮다.
// 시간 선택 상태는 전역(selectedSlotByGroup)에 있으므로 접었다 펴도 유지된다.
export function AlternativeCandidateAccordion({
  group,
  people,
  selectedSlot,
  onSelectSlot,
  onConfirm,
  initialExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(initialExpanded)

  const summaryParts = [`${formatSlotLabel(selectedSlot)}`, `${group.attendingCount}명 참석`]
  if (new Set(group.prefUnmet).size === 0) summaryParts.push('모두가 원하는 시간')

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface-card shadow-card">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={CONTENT_ID}
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-card-pad text-left hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
      >
        <span className="min-w-0">
          <strong className="block text-sm font-bold text-ink-900">{expanded ? '다른 안 접기' : '다른 안 보기'}</strong>
          <span className="mt-heading-gap block text-xs text-ink-500">{summaryParts.join(' · ')}</span>
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-lg text-ink-500 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
        >
          ⌄
        </span>
      </button>

      {expanded && (
        <div id={CONTENT_ID} className="space-y-3 border-t border-border p-card-pad">
          {group.slots.length > 1 && (
            <div>
              <p className="text-xs font-bold text-ink-900">시간을 골라주세요</p>
              <div className="mt-2">
                <SlotPicker slots={group.slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
              </div>
            </div>
          )}
          <CandidateComparison group={group} />
          <ConsiderationNote group={group} people={people} />
          {/* 확정은 현재 선택된 시각으로 — 추천보다 낮은 위계(secondary). */}
          <Button variant="secondary" className="w-full" onClick={onConfirm}>
            이 시간으로 확정하기
          </Button>
        </div>
      )}
    </div>
  )
}
