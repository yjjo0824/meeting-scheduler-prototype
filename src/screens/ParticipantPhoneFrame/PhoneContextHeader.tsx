import type { Meeting, Person } from '../../types/domain'

interface Props {
  person: Person
  meeting: Meeting
  organizerName: string
}

export function PhoneContextHeader({ person, meeting, organizerName }: Props) {
  return (
    <header className="space-y-1 border-b border-slate-100 pb-3">
      <p className="text-xs text-slate-400">{organizerName} 님이 회의 시간 조율을 요청했어요</p>
      <h2 className="text-base font-semibold text-slate-900">{meeting.title}</h2>
      <p className="text-xs text-slate-500">
        {meeting.window} 중 · {meeting.duration_hours}시간 · {meeting.response_deadline}까지 응답
      </p>
      <p className="text-xs text-slate-400">{person.name} 님</p>
    </header>
  )
}
