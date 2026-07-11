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
        <p className="font-medium text-slate-700">참석자</p>
        <p className="text-slate-600">{attendees.map((p) => p.name).join(', ')}</p>
      </div>
      {excluded.length > 0 && (
        <div>
          <p className="font-medium text-slate-400">이번엔 함께하지 못해요</p>
          <p className="text-slate-400">{excluded.map((p) => p.name).join(', ')}</p>
        </div>
      )}
    </div>
  )
}
