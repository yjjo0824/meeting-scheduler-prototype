import type { Person } from '../../types/domain'
import { ResponseStatusRow } from './ResponseStatusRow'

interface Props {
  people: Person[]
  hasResponded: Record<string, boolean>
  selectedPersonId: string | null
  onSelectPerson: (personId: string) => void
  onOpenPhoneFrame: (personId: string) => void
}

export function ResponseStatusList({
  people,
  hasResponded,
  selectedPersonId,
  onSelectPerson,
  onOpenPhoneFrame,
}: Props) {
  return (
    <ul className="space-y-2">
      {people.map((person) => (
        <ResponseStatusRow
          key={person.id}
          person={person}
          responded={hasResponded[person.id]}
          selected={person.id === selectedPersonId}
          onSelect={() => onSelectPerson(person.id)}
          onOpenPhoneFrame={() => onOpenPhoneFrame(person.id)}
        />
      ))}
    </ul>
  )
}
