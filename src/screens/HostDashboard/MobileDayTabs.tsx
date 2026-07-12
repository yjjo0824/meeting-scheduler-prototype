import type { Day } from '../../types/domain'

interface Props {
  days: Day[]
  selectedDay: Day
  onSelectDay: (day: Day) => void
}

// 단일 선택 요일 탭 — 한 번에 하루치 6명×8슬롯 그리드만 보여줘서(MobileDayCompareGrid),
// 요일별 미니 지도를 전부 쌓아두던 12A.7~12A.8의 실패(화면이 길어짐·셀 불균일)를 반복하지 않는다.
export function MobileDayTabs({ days, selectedDay, onSelectDay }: Props) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="요일 선택">
      {days.map((day) => {
        const selected = day === selectedDay
        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelectDay(day)}
            className={`flex-1 rounded-card py-2 text-sm font-bold ${
              selected ? 'bg-brand-500 text-white' : 'bg-surface-muted text-ink-700'
            }`}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}
