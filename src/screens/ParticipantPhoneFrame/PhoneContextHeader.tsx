import type { Meeting, Person } from '../../types/domain'

interface Props {
  person: Person
  meeting: Meeting
  organizerName: string
}

/* 폰 프레임 상단 맥락(12D-1, 참고안 위계) — kicker(응답 기한 강조) → 회의명(가장 큰 위계) →
   meta(요청자·범위·길이). 모든 값은 seed에서 파생한다. */
export function PhoneContextHeader({ person, meeting, organizerName }: Props) {
  return (
    <header className="space-y-1 border-b border-border pb-4">
      <p className="text-xs font-bold text-brand-600">{meeting.response_deadline}까지 답변해 주세요</p>
      <h2 id="phone-frame-title" className="text-2xl font-bold leading-snug tracking-tight text-ink-900">
        {meeting.title}
      </h2>
      <p className="text-sm text-ink-700">
        {organizerName} 님이 요청했어요 · {meeting.window} · {meeting.duration_hours}시간
      </p>
      <p className="text-xs text-ink-500">{person.name} 님</p>
    </header>
  )
}
