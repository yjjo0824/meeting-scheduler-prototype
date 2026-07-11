import type { Person } from '../../types/domain'

interface Props {
  person: Person
  onEdit: () => void
}

// IMPLEMENTATION_SPEC §5 "제출 완료" 상태: 요약 + 수정 진입점.
// 확정 전까지는 언제든 다시 열어 수정할 수 있다는 것을 먼저 보여주고, 편집 폼은 [수정하기]를 눌러야 나온다.
export function SubmittedSummaryView({ person, onEdit }: Props) {
  const chips = person.response.chips

  return (
    <div className="space-y-3 py-4 text-sm text-slate-600">
      <p>응답을 보냈어요. 회의가 확정되기 전까지 언제든 수정할 수 있어요.</p>
      {chips.length > 0 ? (
        <ul className="space-y-1 text-xs text-slate-500">
          {chips.map((chip, i) => (
            <li key={`${chip.type}-${chip.day}-${chip.hours.join('_')}-${i}`}>
              [{chip.type}] {chip.day === '*' ? '매일' : chip.day} {chip.hours.map((h) => `${h}시`).join(', ')}
              {chip.cue && <span className="text-slate-400"> · {chip.cue}</span>}
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
