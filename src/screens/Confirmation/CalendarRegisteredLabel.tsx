interface Props {
  attendeeCount: number
}

// R5: 실제 캘린더 API 연동 없이 라벨로 컨셉만 전달한다. 12D-3: 아이콘 리스트 항목 형태 —
// 인원 수는 확정된 참석자 수에서 파생한다.
export function CalendarRegisteredLabel({ attendeeCount }: Props) {
  return (
    <div className="flex gap-3 p-card-pad-sm">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip bg-brand-50 text-xs font-extrabold text-brand-600"
      >
        ✓
      </span>
      <div>
        <p className="text-sm font-bold text-ink-900">참석자 캘린더에 등록했어요</p>
        <p className="mt-0.5 text-xs text-ink-500">{attendeeCount}명 모두에게 같은 일정이 추가됐어요.</p>
      </div>
    </div>
  )
}
