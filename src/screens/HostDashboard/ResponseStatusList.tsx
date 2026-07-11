import type { Person } from '../../types/domain'
import { ResponseStatusRow } from './ResponseStatusRow'

interface Props {
  people: Person[]
  hasResponded: Record<string, boolean>
  onSelectPerson: (personId: string) => void
}

export function ResponseStatusList({ people, hasResponded, onSelectPerson }: Props) {
  return (
    <ul className="space-y-2">
      {people.map((person) => (
        <ResponseStatusRow
          key={person.id}
          person={person}
          responded={hasResponded[person.id]}
          onClick={() => onSelectPerson(person.id)}
        />
      ))}
    </ul>
  )
}
