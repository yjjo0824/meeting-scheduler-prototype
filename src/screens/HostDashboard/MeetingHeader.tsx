import type { Meeting } from '../../types/domain'
import { Badge } from '../../shared/Badge'

interface Props {
  meeting: Meeting
  respondedCount: number
}

export function MeetingHeader({ meeting, respondedCount }: Props) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-brand-600">회의 시간 조율 중</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink-900">{meeting.title}</h1>
        <p className="mt-heading-gap text-sm text-ink-500">
          {meeting.window} 중 · {meeting.duration_hours}시간 · {meeting.response_deadline}까지 응답
        </p>
      </div>
      <Badge tone="brand">{respondedCount}명이 답변했어요</Badge>
    </header>
  )
}
