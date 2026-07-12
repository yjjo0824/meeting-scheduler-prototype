import type { Chip } from '../../types/domain'

interface Props {
  chip: Chip
  onToggleType: () => void
  onDelete: () => void
}

/* 조건 타입의 의미(불가=위험, 회피=주의, 조정가능=긍정 여지, 병합·미분류=중립)는 유지하되
   색은 제품 토큰 팔레트(danger/warn/brand/중립)로만 표현한다 — 화면별 임의 색상 금지. */
const CHIP_STYLE: Record<Chip['type'], string> = {
  불가: 'bg-danger-50 text-danger-600 border-danger-100',
  회피: 'bg-warn-50 text-warn-600 border-warn-100',
  병합: 'bg-surface-muted text-ink-500 border-border',
  조정가능: 'bg-brand-50 text-brand-600 border-brand-100',
  미분류: 'bg-surface-muted text-ink-500 border-dashed border-border',
}

export function ChipItem({ chip, onToggleType, onDelete }: Props) {
  const dayLabel = chip.day === '*' ? '매일' : chip.day
  const hoursLabel = chip.hours.length > 0 ? chip.hours.map((h) => `${h}시`).join(', ') : '시간 미지정'

  return (
    <div className={`flex items-center justify-between rounded-pill border px-3 py-1.5 text-xs ${CHIP_STYLE[chip.type]}`}>
      <button type="button" onClick={onToggleType} className="text-left">
        [{chip.type}] {dayLabel} {hoursLabel}
        {chip.cue && <span className="ml-1 text-[10px] opacity-60">· {chip.cue}</span>}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="ml-2 px-1 text-ink-500 hover:text-ink-700"
        aria-label="삭제"
      >
        ×
      </button>
    </div>
  )
}
