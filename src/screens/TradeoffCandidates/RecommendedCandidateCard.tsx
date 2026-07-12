import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { formatPositiveLine } from '../../presentation/candidateCopy'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { Badge } from '../../shared/Badge'
import { Button } from '../../shared/Button'
import { CandidateComparison, ConsiderationNote } from './CandidateComparison'
import { SlotPicker } from './SlotPicker'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  people: Person[]
  tentative: boolean
  selectedSlot: Slot
  onSelectSlot: (slot: Slot) => void
  onConfirm: () => void
}

// 추천 후보 카드(1순위, SPEC R2) — 라디오 선택 없이 그 자체로 충분히 설명하고, 확정은 카드
// 내부 CTA로 바로 한다. 흰 배경 + 파란 2px 테두리(선택 UI가 아니라 "추천" 강조).
// 정보 순서: 배지 → 시간(가장 큰 텍스트) → 핵심 설명 → (시간 선택) → 비교 지표 2개 →
// 고려할 점 → 확정 CTA. 값은 전부 엔진 결과 파생, cost 비노출.
export function RecommendedCandidateCard({ group, people, tentative, selectedSlot, onSelectSlot, onConfirm }: Props) {
  return (
    <article className="space-y-3 rounded-card border-2 border-brand-500 bg-surface-card p-card-pad shadow-card">
      <div className="flex items-center gap-2">
        <Badge tone="brand">추천</Badge>
        {tentative && <TentativeBadge />}
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-ink-900">{formatSlotLabel(selectedSlot)}</p>
      <p className="text-base font-bold text-ink-900">{formatPositiveLine(group)}</p>
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
      {/* 확정은 이 카드 안에서 끝난다 — 현재 선택된 시각을 확정하고 Confirmation으로 이동(호출부). */}
      <Button className="w-full" onClick={onConfirm}>
        이 시간으로 확정하기
      </Button>
    </article>
  )
}
