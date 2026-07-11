import type { Person } from '../../types/domain'
import { attendanceLabel, buildConditionSummary } from '../../presentation/conditionCopy'
import { deriveEffectivePeople } from '../../state/useSchedule'

interface Props {
  person: Person
  responded: boolean
  selected: boolean
  onSelect: () => void
  onOpenPhoneFrame: () => void
}

// 응답 전에는 캘린더만 알려진 상태(R7)이므로, 응답 칩은 아직 조건 목록에 노출하지 않는다.
// 행 클릭은 선택(상세 표시)만 한다 — 참여자 화면은 선택된 행의 명시적 버튼을 눌러야 열린다
// (자유 모드에서 갑자기 화면이 전환되는 것을 막기 위함).
export function ResponseStatusRow({ person, responded, selected, onSelect, onOpenPhoneFrame }: Props) {
  const [effectivePerson] = deriveEffectivePeople([person], { [person.id]: responded })
  const items = buildConditionSummary([effectivePerson])

  return (
    <li>
      <div
        className={`rounded-lg border p-3 transition ${
          selected ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <button type="button" onClick={onSelect} className="w-full text-left">
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

        {selected && (
          <button
            type="button"
            onClick={onOpenPhoneFrame}
            className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
          >
            참여자 화면 보기
          </button>
        )}
      </div>
    </li>
  )
}
