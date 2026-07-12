import { formatDisplayDate } from '../../presentation/dateDisplay'
import type { Meeting, ScheduleDisplay } from '../../types/domain'
import type { Slot } from '../../types/engine'

interface Props {
  meeting: Meeting
  slot: Slot
  display: ScheduleDisplay
}

// 확정 날짜·시간은 seed.schedule_display + 확정 슬롯에서 파생한다(표시 전용 — 엔진은 날짜를 모른다).
// 위계: 성공 상태(eyebrow, success 토큰) → 회의명 → 확정 시간(가장 궁금한 정보라 가장 강하게).
export function ResultSummary({ meeting, slot, display }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-bold text-success-600">회의 시간이 확정됐어요</p>
      <h1 className="text-2xl font-bold text-ink-900">{meeting.title}</h1>
      <p className="text-xl font-extrabold tracking-tight text-brand-600">
        {formatDisplayDate(slot.day, slot.hour, display)}
      </p>
    </div>
  )
}
