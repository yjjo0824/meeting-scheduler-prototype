import type { Person } from '../../types/domain'
import { attendanceLabel, buildConditionSummary } from '../../presentation/conditionCopy'
import { deriveEffectivePeople } from '../../state/useSchedule'

interface Props {
  person: Person
  responded: boolean
  onClick: () => void
}

// 응답 전에는 캘린더만 알려진 상태(R7)이므로, 응답 칩은 아직 조건 목록에 노출하지 않는다.
export function ResponseStatusRow({ person, responded, onClick }: Props) {
  const [effectivePerson] = deriveEffectivePeople([person], { [person.id]: responded })
  const items = buildConditionSummary([effectivePerson])

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-slate-300"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-900">
            {person.name} · {person.job} · {attendanceLabel(person.attendance)}
          </span>
          <span className={responded ? 'text-emerald-600' : 'text-amber-600'}>
            {responded ? '응답 완료' : '미응답'}
          </span>
        </div>
        {items.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
            {items.map((item) => (
              <li key={item.key}>
                {item.text} <span className="text-slate-400">· {item.source}</span>
              </li>
            ))}
          </ul>
        )}
      </button>
    </li>
  )
}
