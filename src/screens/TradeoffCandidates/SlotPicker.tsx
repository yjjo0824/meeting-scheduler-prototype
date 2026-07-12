import { useState } from 'react'
import type { Slot } from '../../types/engine'

interface Props {
  slots: Slot[]
  selectedSlot: Slot
  onSelectSlot: (slot: Slot) => void
}

function slotEquals(a: Slot, b: Slot): boolean {
  return a.day === b.day && a.hour === b.hour
}

// 그룹당 시간 3개 노출 + 초과분은 "n개 더 보기". 숨는 게 1개뿐이면 전부 노출한다(R2).
// 시간 버튼은 h-control-sm(36px) 최소 터치 영역과 state-selected 토큰을 쓴다.
export function SlotPicker({ slots, selectedSlot, onSelectSlot }: Props) {
  const [expanded, setExpanded] = useState(false)
  const hiddenCount = slots.length - 3
  const visible = expanded || hiddenCount <= 1 ? slots : slots.slice(0, 3)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((slot) => (
        <button
          key={`${slot.day}-${slot.hour}`}
          type="button"
          aria-pressed={slotEquals(slot, selectedSlot)}
          onClick={() => onSelectSlot(slot)}
          className={`h-control-sm rounded-pill border px-3.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
            slotEquals(slot, selectedSlot)
              ? 'border-state-selected bg-state-selected-soft font-semibold text-brand-600'
              : 'border-border bg-surface text-ink-700 hover:bg-surface-muted'
          }`}
        >
          {slot.day}요일 {slot.hour}시
        </button>
      ))}
      {!expanded && hiddenCount > 1 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-1 py-2 text-xs text-ink-500 underline hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {hiddenCount}개 더 보기
        </button>
      )}
    </div>
  )
}
