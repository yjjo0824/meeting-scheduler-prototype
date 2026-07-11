import type { Person } from '../../types/domain'
import type { CandidateGroup } from '../../types/engine'
import { formatSacrifice } from '../../presentation/candidateCopy'

export function CandidateGroupTierTwo({ group, people }: { group: CandidateGroup; people: Person[] }) {
  return <p className="text-xs text-slate-500">{formatSacrifice(group, people)}</p>
}
