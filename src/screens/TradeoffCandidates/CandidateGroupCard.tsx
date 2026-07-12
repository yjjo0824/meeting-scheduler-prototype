import { useState } from 'react'
import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { formatAttendSummary, formatUnmetConditions } from '../../presentation/candidateCopy'
import { formatSlotLabel, formatSlotsRangeLabel } from '../../presentation/dateDisplay'
import { AskSpecificallyEntry } from './AskSpecificallyEntry'
import { ConfirmButton } from './ConfirmButton'
import { SlotPicker } from './SlotPicker'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  people: Person[]
  highlighted: boolean
  tentative: boolean
  selectedSlot: Slot
  showFreeModeExtras: boolean
  onSelectSlot: (slot: Slot) => void
  onConfirm: (slot: Slot) => void
}

// 카드 읽기 순서(위→아래): ① 추천/다른 안 ② 대표 시간 ③ 참석 인원 ④ 반영하지 못한 조건
// ⑤ 같은 조건의 다른 시간 선택 ⑥ 확정 CTA. 접힌 대안도 ①~④는 항상 보여 비교가 가능하다.
// cost 숫자는 어디에도 읽지 않는다(SPEC §4.3).
export function CandidateGroupCard({
  group,
  people,
  highlighted,
  tentative,
  selectedSlot,
  showFreeModeExtras,
  onSelectSlot,
  onConfirm,
}: Props) {
  const [expanded, setExpanded] = useState(highlighted)
  const open = highlighted || expanded

  // 대표 시간: 펼친 카드는 지금 선택된 슬롯, 접힌 카드는 그룹 전체 범위("수요일 오후 2–5시")로
  // 접어 보여준다 — 접힌 상태에서도 어떤 시간대의 안인지 비교할 수 있어야 한다.
  const headline = open ? formatSlotLabel(selectedSlot) : formatSlotsRangeLabel(group.slots)

  return (
    <div className={`rounded-xl border p-4 ${highlighted ? 'border-slate-900 shadow-sm' : 'border-slate-200'}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
              highlighted ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {highlighted ? '추천' : '다른 안'}
          </span>
          {tentative && <TentativeBadge />}
        </div>
        <p className="text-lg font-semibold text-slate-900">{headline}</p>
        <p className="text-sm font-medium text-slate-700">{formatAttendSummary(group)}</p>
        <p className="text-xs text-slate-500">{formatUnmetConditions(group, people)}</p>
      </div>

      {open ? (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <SlotPicker slots={group.slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ConfirmButton label={`${formatSlotLabel(selectedSlot)}로 확정하기`} onClick={() => onConfirm(selectedSlot)} />
            {showFreeModeExtras && <AskSpecificallyEntry />}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
        >
          시간 선택하기
        </button>
      )}
    </div>
  )
}
