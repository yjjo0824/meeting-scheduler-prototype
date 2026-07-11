import type { Chip } from '../../types/domain'

interface Props {
  chip: Chip
  onToggleType: () => void
  onDelete: () => void
}

const CHIP_STYLE: Record<Chip['type'], string> = {
  불가: 'bg-red-50 text-red-700 border-red-200',
  회피: 'bg-amber-50 text-amber-700 border-amber-200',
  병합: 'bg-slate-100 text-slate-500 border-slate-200',
  조정가능: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  미분류: 'bg-slate-100 text-slate-400 border-dashed border-slate-300',
}

export function ChipItem({ chip, onToggleType, onDelete }: Props) {
  const dayLabel = chip.day === '*' ? '매일' : chip.day
  const hoursLabel = chip.hours.length > 0 ? chip.hours.map((h) => `${h}시`).join(', ') : '시간 미지정'

  return (
    <div className={`flex items-center justify-between rounded-full border px-3 py-1 text-xs ${CHIP_STYLE[chip.type]}`}>
      <button type="button" onClick={onToggleType} className="text-left">
        [{chip.type}] {dayLabel} {hoursLabel}
        {chip.cue && <span className="ml-1 text-[10px] opacity-60">· {chip.cue}</span>}
      </button>
      <button type="button" onClick={onDelete} className="ml-2 text-slate-400 hover:text-slate-600" aria-label="삭제">
        ×
      </button>
    </div>
  )
}
