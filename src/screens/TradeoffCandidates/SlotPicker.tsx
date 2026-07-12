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
          className={`rounded-full border px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
            slotEquals(slot, selectedSlot)
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-600'
          }`}
        >
          {slot.day}요일 {slot.hour}시
        </button>
      ))}
      {!expanded && hiddenCount > 1 && (
        <button type="button" onClick={() => setExpanded(true)} className="text-xs text-slate-400 underline">
          {hiddenCount}개 더 보기
        </button>
      )}
    </div>
  )
}
