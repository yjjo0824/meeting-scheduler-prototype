import type { Meeting } from '../../types/domain'
import type { Slot } from '../../types/engine'

interface Props {
  meeting: Meeting
  slot: Slot
}

export function ResultSummary({ meeting, slot }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-indigo-600">회의 시간이 확정됐어요</p>
      <h1 className="text-xl font-semibold text-slate-900">{meeting.title}</h1>
      <p className="text-base text-slate-700">
        {slot.day}요일 {slot.hour}시
      </p>
    </div>
  )
}
