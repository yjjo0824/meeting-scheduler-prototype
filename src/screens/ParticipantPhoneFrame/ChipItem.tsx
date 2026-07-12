import type { Chip } from '../../types/domain'
import { formatHourLabel } from '../../presentation/dateDisplay'

interface Props {
  chip: Chip
  onDelete: () => void
  // 불가·회피 칩에서만 렌더되는 "조건 바꾸기"의 핸들러 — 상태 라벨은 표시 전용이고,
  // 수정 진입은 이 명시적 버튼 하나로만 한다(숨은 토글·카드 전체 탭 금지).
  onRequestChange: () => void
}

/* 조건 타입 라벨(12D-1) — 내부 용어([불가]/[회피]/[병합]) 대신 사용자 언어로 말한다. 조건 지도
   레전드("참석 어려움"/"가급적 피함"/"옮길 수 있음")와 같은 언어를 쓴다. 색은 의미 유지 +
   제품 토큰 팔레트로만 표현한다. 병합은 상태가 아니라 출처 중심으로 말한다(캘린더에서 확인). */
export const CHIP_TYPE_LABEL: Record<Chip['type'], string> = {
  불가: '참석 어려움',
  회피: '가급적 피함',
  병합: '캘린더에서 확인',
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
export function chipTimeLabel(chip: Chip): string {
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
// 병합 칩은 cue보다 "왜 여기서 수정할 수 없는지"(이미 캘린더에 있는 일정)가 우선 정보다.
function chipCueLine(chip: Chip): string | null {
  if (chip.type === '병합') return '이미 등록된 일정과 같아요'
  if (chip.cue) return `“${chip.cue}”에서 이해했어요`
  if (chip.type === '미분류') return '어떤 시간인지 눌러서 알려주세요'
  return null
}

// 조건 카드 — 상태를 보여주는 요소와 실행할 수 있는 행동을 분리한다.
// · 불가/회피: 수정 가능 카드. 상태 pill(보조 위계) + 시간(주 위계) + 근거 한 줄, 우측에
//   명시적 "조건 바꾸기" 버튼. 전환 범위는 SPEC R3의 불가↔회피뿐이다.
// · 병합: 정보 전용 카드. 캘린더의 기존 불가 조건과 병합된 상태라 여기서는 바꿀 수 없다
//   (R5·R6 — 캘린더 원본 불변). 변경 버튼·chevron·hover·pointer 없이 회색 배경으로 구분하되,
//   흐리게 만들지 않고 읽을 수 있는 정보 카드로 둔다.
// · 조정가능/미분류: 불가↔회피 전환 대상이 아니므로 변경 버튼 없이 표시.
// × 삭제는 모든 칩 공통(현행 기능 유지 — 병합 칩을 지워도 캘린더 원본은 그대로다).
export function ChipItem({ chip, onDelete, onRequestChange }: Props) {
  const cueLine = chipCueLine(chip)
  const isMerged = chip.type === '병합'
  const editable = chip.type === '불가' || chip.type === '회피'

  return (
    <div
      className={`flex w-full items-start justify-between gap-2 rounded-chip p-3 ${
        isMerged
          ? 'bg-surface-muted'
          : `border bg-surface ${chip.type === '미분류' ? 'border-dashed border-border' : 'border-border'}`
      }`}
    >
      <div className="min-w-0">
        {isMerged ? (
          <span className="block text-[11px] font-bold text-ink-500">{CHIP_TYPE_LABEL['병합']}</span>
        ) : (
          <span
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-pill px-2 py-1 text-[11px] font-bold ${CHIP_TYPE_CLASS[chip.type]}`}
          >
            {CHIP_TYPE_LABEL[chip.type]}
          </span>
        )}
        <span className={`block text-sm font-bold text-ink-900 ${isMerged ? 'mt-heading-gap' : 'mt-1.5'}`}>
          {chipTimeLabel(chip)}
        </span>
        {cueLine && <span className="mt-0.5 block text-xs text-ink-500">{cueLine}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {editable && (
          <button
            type="button"
            onClick={onRequestChange}
            aria-label={`${chipTimeLabel(chip)} 조건 바꾸기, 현재 ${CHIP_TYPE_LABEL[chip.type]}`}
            className="min-h-11 rounded-chip px-2.5 text-xs font-bold text-brand-600 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
          >
            조건 바꾸기
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="min-h-11 px-1.5 text-sm text-ink-500 hover:text-ink-700"
          aria-label="삭제"
        >
          ×
        </button>
      </div>
    </div>
  )
}
