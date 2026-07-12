import type { Chip } from '../../types/domain'
import { formatHourLabel } from '../../presentation/dateDisplay'

interface Props {
  chip: Chip
  onToggleType: () => void
  onDelete: () => void
}

/* 조건 타입 라벨(12D-1) — 내부 용어([불가]/[회피]/[병합]) 대신 사용자 언어로 말한다. 조건 지도
   레전드("참석 어려움"/"가급적 피함"/"옮길 수 있음")와 같은 언어를 쓴다. 색은 의미 유지 +
   제품 토큰 팔레트로만 표현한다. */
const CHIP_TYPE_LABEL: Record<Chip['type'], string> = {
  불가: '참석 어려움',
  회피: '가급적 피함',
  병합: '캘린더에 있어요',
  조정가능: '옮길 수 있음',
  미분류: '확인 필요',
}

const CHIP_TYPE_CLASS: Record<Chip['type'], string> = {
  불가: 'bg-danger-50 text-danger-600',
  회피: 'bg-warn-50 text-warn-600',
  병합: 'bg-surface-muted text-ink-700',
  조정가능: 'bg-brand-50 text-brand-600',
  미분류: 'bg-surface-muted text-ink-500',
}

// "수요일 오후 2–5시" — 같은 시간대의 연속 슬롯은 범위로 접는다(후보 카드와 같은 표기 관례:
// 종료 시각이 아니라 시작 시각들의 범위다). 그 외에는 시각 나열.
function chipTimeLabel(chip: Chip): string {
  const dayLabel = chip.day === '*' ? '매일' : `${chip.day}요일`
  if (chip.hours.length === 0) return `${dayLabel} 시간 미지정`
  const contiguous = chip.hours.every((h, i) => i === 0 || h === chip.hours[i - 1] + 1)
  if (chip.hours.length > 1 && contiguous) {
    const first = chip.hours[0]
    const last = chip.hours[chip.hours.length - 1]
    const firstLabel = formatHourLabel(first)
    const lastLabel = formatHourLabel(last)
    const samePeriod = firstLabel.split(' ')[0] === lastLabel.split(' ')[0]
    return samePeriod
      ? `${dayLabel} ${firstLabel}–${lastLabel.split(' ')[1]}`
      : `${dayLabel} ${firstLabel}–${lastLabel}`
  }
  return `${dayLabel} ${chip.hours.map((h) => formatHourLabel(h)).join(', ')}`
}

// cue 설명 줄 — 본인 화면이므로 원문 단서를 보여줘도 된다(R4: 타인에게만 비노출, 정본 §5).
function chipCueLine(chip: Chip): string | null {
  if (chip.cue) return `“${chip.cue}”에서 이해했어요`
  if (chip.type === '병합') return '이미 등록된 일정과 같아요'
  if (chip.type === '미분류') return '어떤 시간인지 눌러서 알려주세요'
  return null
}

// 카드형 조건 칩(12D-1) — 타입 pill + 시간(강조) + 이해 근거 한 줄. 본문 탭 = 성격 전환
// (불가↔회피), × = 삭제 — 기능은 현행 그대로다.
export function ChipItem({ chip, onToggleType, onDelete }: Props) {
  const cueLine = chipCueLine(chip)

  return (
    <div
      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-chip border bg-surface p-3 ${
        chip.type === '미분류' ? 'border-dashed border-border' : 'border-border'
      }`}
    >
      <button type="button" onClick={onToggleType} className="contents text-left">
        <span
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-pill px-2 py-1 text-[11px] font-bold ${CHIP_TYPE_CLASS[chip.type]}`}
        >
          {CHIP_TYPE_LABEL[chip.type]}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink-900">{chipTimeLabel(chip)}</span>
          {cueLine && <span className="mt-0.5 block text-xs text-ink-500">{cueLine}</span>}
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="px-1.5 py-1 text-sm text-ink-500 hover:text-ink-700"
        aria-label="삭제"
      >
        ×
      </button>
    </div>
  )
}
