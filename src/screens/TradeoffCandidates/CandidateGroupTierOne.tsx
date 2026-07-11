import type { Person } from '../../types/domain'
import type { CandidateGroup } from '../../types/engine'
import { formatTierOne } from '../../presentation/candidateCopy'

export function CandidateGroupTierOne({ group, people }: { group: CandidateGroup; people: Person[] }) {
  return <p className="text-sm font-medium text-slate-900">{formatTierOne(group, people)}</p>
}
