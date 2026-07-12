import { useState } from 'react'
import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { AskSpecificallyEntry } from './AskSpecificallyEntry'
import { CandidateGroupTierOne } from './CandidateGroupTierOne'
import { CandidateGroupTierTwo } from './CandidateGroupTierTwo'
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

  return (
    <div className={`rounded-xl border p-4 ${highlighted ? 'border-slate-900 shadow-sm' : 'border-slate-200'}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {highlighted && (
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">추천</span>
            )}
            <CandidateGroupTierOne group={group} people={people} />
            {tentative && <TentativeBadge />}
          </div>
          <CandidateGroupTierTwo group={group} people={people} />
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <SlotPicker slots={group.slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ConfirmButton onClick={() => onConfirm(selectedSlot)} />
            {showFreeModeExtras && <AskSpecificallyEntry />}
          </div>
        </div>
      )}
    </div>
  )
}
