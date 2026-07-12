import type { Meeting } from '../../types/domain'

interface Props {
  meeting: Meeting
}

// 성공 상태 헤더(12D-3, 참고안 위계) — 원형 ✓ 아이콘 → "회의 시간이 확정됐어요"(제목) →
// 회의명(보조 meta). 확정 시간은 아래 "확정 시간" 카드가 담당한다.
export function ResultSummary({ meeting }: Props) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-pill bg-brand-50 text-xl font-extrabold text-brand-600"
      >
        ✓
      </div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900">회의 시간이 확정됐어요</h1>
      <p className="mt-heading-gap text-sm text-ink-700">{meeting.title}</p>
    </div>
  )
}
