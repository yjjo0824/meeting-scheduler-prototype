import type { Chip } from '../../types/domain'
import { ChipItem } from './ChipItem'

interface Props {
  chips: Chip[]
  onChangeChips: (chips: Chip[]) => void
}

function toggleType(type: Chip['type']): Chip['type'] {
  if (type === '불가') return '회피'
  if (type === '회피') return '불가'
  return type
}

export function ChipReviewList({ chips, onChangeChips }: Props) {
  return (
    <div className="space-y-2 py-3">
      <p className="text-sm font-medium text-slate-700">이렇게 이해했어요 — 탭해서 고칠 수 있어요</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <ChipItem
            key={`${chip.type}-${chip.day}-${chip.hours.join('_')}-${index}`}
            chip={chip}
            onToggleType={() =>
              onChangeChips(chips.map((c, i) => (i === index ? { ...c, type: toggleType(c.type) } : c)))
            }
            onDelete={() => onChangeChips(chips.filter((_, i) => i !== index))}
          />
        ))}
        {chips.length === 0 && <p className="text-xs text-slate-400">아직 추가한 조건이 없어요</p>}
      </div>
    </div>
  )
}
