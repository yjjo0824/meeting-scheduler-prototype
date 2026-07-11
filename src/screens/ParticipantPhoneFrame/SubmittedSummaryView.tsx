import { buildConditionSummary, formatHourRange, groupConditionsByDay } from '../../presentation/conditionCopy'
import type { Person } from '../../types/domain'

interface Props {
  person: Person
  onEdit: () => void
}

// IMPLEMENTATION_SPEC §5 "제출 완료" 상태: 요약 + 수정 진입점.
// 확정 전까지는 언제든 다시 열어 수정할 수 있다는 것을 먼저 보여주고, 편집 폼은 [수정하기]를 눌러야 나온다.
// 본인 화면이므로 캘린더 기반 조건까지 합쳐 "지금 실제로 적용 중인" 조건 전체를 보여준다(response.chips만
// 보여주면 캘린더에서 온 불가 조건이 누락된다) — R4상 본인은 원문·사유까지 전부 볼 수 있어 cue도 노출한다.
export function SubmittedSummaryView({ person, onEdit }: Props) {
  const groups = groupConditionsByDay(buildConditionSummary([person]))

  return (
    <div className="space-y-3 py-4 text-sm text-slate-600">
      <p>응답을 보냈어요. 회의가 확정되기 전까지 언제든 수정할 수 있어요.</p>
      {groups.length > 0 ? (
        <ul className="space-y-2 text-xs text-slate-500">
          {groups.map((group) => (
            <li key={group.day}>
              <p className="font-semibold text-slate-700">{group.day === '매일' ? '매일' : `${group.day}요일`}</p>
              <ul className="mt-0.5 space-y-0.5 pl-2">
                {group.items.map((item) => (
                  <li key={item.key}>
                    {formatHourRange(item.hours)} · {item.typeLabel}
                    {item.cue && <span className="text-slate-400"> · {item.cue}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">추가 조건 없이 캘린더 일정만 반영했어요</p>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
      >
        수정하기
      </button>
    </div>
  )
}
