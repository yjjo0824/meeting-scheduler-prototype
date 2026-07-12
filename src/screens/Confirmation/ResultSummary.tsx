import { formatDisplayDate } from '../../presentation/dateDisplay'
import type { Meeting, ScheduleDisplay } from '../../types/domain'
import type { Slot } from '../../types/engine'

interface Props {
  meeting: Meeting
  slot: Slot
  display: ScheduleDisplay
}

// 확정 날짜·시간은 seed.schedule_display + 확정 슬롯에서 파생한다(표시 전용 — 엔진은 날짜를 모른다).
export function ResultSummary({ meeting, slot, display }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-indigo-600">회의 시간이 확정됐어요</p>
      <h1 className="text-xl font-semibold text-slate-900">{meeting.title}</h1>
      <p className="text-base text-slate-700">{formatDisplayDate(slot.day, slot.hour, display)}</p>
    </div>
  )
}
