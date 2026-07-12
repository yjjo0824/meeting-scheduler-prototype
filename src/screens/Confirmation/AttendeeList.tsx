import type { Person } from '../../types/domain'

interface Props {
  people: Person[]
  excludedIds: string[]
}

// 참석자 한 줄 명단(12D-3, 참고안 패턴 "지원 · 민준 · …") — 제외자가 있으면 별도 줄로 표시한다.
export function AttendeeList({ people, excludedIds }: Props) {
  const attendees = people.filter((p) => !excludedIds.includes(p.id))
  const excluded = people.filter((p) => excludedIds.includes(p.id))

  return (
    <div className="space-y-1 text-sm">
      <p className="text-ink-700">{attendees.map((p) => p.name).join(' · ')}</p>
      {excluded.length > 0 && (
        <p className="text-ink-500">이번엔 함께하지 못해요 · {excluded.map((p) => p.name).join(' · ')}</p>
      )}
    </div>
  )
}
