import type { Meeting } from '../../types/domain'

export function MeetingHeader({ meeting }: { meeting: Meeting }) {
  return (
    <header className="space-y-1">
      <h1 className="text-xl font-semibold text-slate-900">{meeting.title}</h1>
      <p className="text-sm text-slate-500">
        {meeting.window} 중 · {meeting.duration_hours}시간 · {meeting.response_deadline}까지 응답
      </p>
    </header>
  )
}
