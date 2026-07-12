import type { Meeting, Person } from '../../types/domain'

interface Props {
  person: Person
  meeting: Meeting
  organizerName: string
}

/* 폰 프레임 상단 맥락 — HostDashboard의 MeetingHeader와 같은 위계 언어(eyebrow → 제목 → 보조)를
   좁은 폭에 맞는 크기로 쓴다. */
export function PhoneContextHeader({ person, meeting, organizerName }: Props) {
  return (
    <header className="space-y-1 border-b border-border pb-3">
      <p className="text-xs font-bold text-brand-600">{organizerName} 님이 회의 시간 조율을 요청했어요</p>
      <h2 id="phone-frame-title" className="text-base font-bold text-ink-900">
        {meeting.title}
      </h2>
      <p className="text-xs text-ink-700">
        {meeting.window} 중 · {meeting.duration_hours}시간 · {meeting.response_deadline}까지 응답
      </p>
      <p className="text-xs text-ink-500">{person.name} 님</p>
    </header>
  )
}
