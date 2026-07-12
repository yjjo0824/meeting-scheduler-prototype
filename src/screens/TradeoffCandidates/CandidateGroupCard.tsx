import { useState } from 'react'
import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { formatAttendSummary, formatUnmetConditions } from '../../presentation/candidateCopy'
import { formatSlotLabel, formatSlotsRangeLabel } from '../../presentation/dateDisplay'
import { AskSpecificallyEntry } from './AskSpecificallyEntry'
import { SlotPicker } from './SlotPicker'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  people: Person[]
  recommended: boolean
  tentative: boolean
  selected: boolean
  selectedSlot: Slot
  showFreeModeExtras: boolean
  onSelect: () => void
  onSelectSlot: (slot: Slot) => void
}

// 카드 = 비교 + 선택 전용(확정 CTA는 화면 하단에 하나만 있다 — TradeoffCandidates).
// 읽기 순서(위→아래): ① 추천/다른 안 ② 대표 시간 ③ 참석 인원 ④ 반영하지 못한 조건
// ⑤ 같은 조건의 다른 시간 선택. 접힌 대안도 ①~④는 항상 보여 비교가 가능하다.
// 선택 상태는 role="radio" + aria-checked로 시각 표시(테두리·라디오 점)와 항상 일치시킨다.
// cost 숫자는 어디에도 읽지 않는다(SPEC §4.3).
export function CandidateGroupCard({
  group,
  people,
  recommended,
  tentative,
  selected,
  selectedSlot,
  showFreeModeExtras,
  onSelect,
  onSelectSlot,
}: Props) {
  const [expanded, setExpanded] = useState(recommended)
  const open = recommended || expanded

  // 대표 시간: 펼친 카드는 지금 선택된 슬롯, 접힌 카드는 그룹 전체 범위("수요일 오후 2–5시")로
  // 접어 보여준다 — 접힌 상태에서도 어떤 시간대의 안인지 비교할 수 있어야 한다.
  const headline = open ? formatSlotLabel(selectedSlot) : formatSlotsRangeLabel(group.slots)

  return (
    <div
      className={`rounded-xl border p-4 ${
        selected ? 'border-slate-900 shadow-sm ring-1 ring-slate-900' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => {
          onSelect()
          setExpanded(true)
        }}
        className="flex w-full items-start gap-3 text-left"
      >
        {/* 시각적 라디오 표시 — aria-checked와 항상 같은 값을 그린다. */}
        <span
          aria-hidden="true"
          className={`mt-1 inline-block h-4 w-4 shrink-0 rounded-full border-2 ${
            selected ? 'border-slate-900 bg-slate-900 shadow-[inset_0_0_0_3px_white]' : 'border-slate-300 bg-white'
          }`}
        />
        <span className="space-y-1">
          <span className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                recommended ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {recommended ? '추천' : '다른 안'}
            </span>
            {tentative && <TentativeBadge />}
          </span>
          <span className="block text-lg font-semibold text-slate-900">{headline}</span>
          <span className="block text-sm font-medium text-slate-700">{formatAttendSummary(group)}</span>
          <span className="block text-xs text-slate-500">{formatUnmetConditions(group, people)}</span>
        </span>
      </button>

      {open ? (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <SlotPicker slots={group.slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
          {showFreeModeExtras && <AskSpecificallyEntry />}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            onSelect()
            setExpanded(true)
          }}
          className="ml-7 mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
        >
          시간 선택하기
        </button>
      )}
    </div>
  )
}
