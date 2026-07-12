import type { Person } from '../../types/domain'

interface Props {
  people: Person[]
  excludedIds: string[]
}

export function AttendeeList({ people, excludedIds }: Props) {
  const attendees = people.filter((p) => !excludedIds.includes(p.id))
  const excluded = people.filter((p) => excludedIds.includes(p.id))

  return (
    <div className="space-y-2 text-sm">
      <div>
        <p className="font-bold text-ink-900">참석자</p>
        <p className="text-ink-700">{attendees.map((p) => p.name).join(', ')}</p>
      </div>
      {excluded.length > 0 && (
        <div>
          <p className="font-bold text-ink-500">이번엔 함께하지 못해요</p>
          <p className="text-ink-500">{excluded.map((p) => p.name).join(', ')}</p>
        </div>
      )}
    </div>
  )
}
