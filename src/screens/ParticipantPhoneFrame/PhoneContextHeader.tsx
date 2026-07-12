import type { Meeting } from '../../types/domain'

interface Props {
  meeting: Meeting
  organizerName: string
}

/* 폰 프레임 상단 맥락(12D-1, 참고안 위계) — kicker(응답 기한 강조) → 회의명(가장 큰 위계) →
   meta(요청자·범위·길이). IMPLEMENTATION_SPEC §5의 필수 요소(요청자·회의명·길이·범위·응답
   기한)만 담는다 — 수신자 이름 표시는 스펙에 없는 요소라 두지 않는다. 값은 전부 seed 파생. */
export function PhoneContextHeader({ meeting, organizerName }: Props) {
  return (
    <header className="space-y-1 border-b border-border pb-4">
      <p className="text-xs font-bold text-brand-600">{meeting.response_deadline}까지 답변해 주세요</p>
      <h2 id="phone-frame-title" className="text-2xl font-bold leading-snug tracking-tight text-ink-900">
        {meeting.title}
      </h2>
      <p className="text-sm text-ink-700">
        {organizerName} 님이 요청했어요 · {meeting.window} · {meeting.duration_hours}시간
      </p>
    </header>
  )
}
