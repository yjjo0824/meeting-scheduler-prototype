import type { Attendance, Person } from '../types/domain'
import { attendanceLabel } from '../presentation/conditionCopy'

interface Props {
  people: Person[]
  onChange: (personId: string, attendance: Attendance) => void
}

// 자유 모드: 참석자 필수/선택 변경 → 즉시 재계산(IMPLEMENTATION_SPEC §8).
export function AttendanceToggle({ people, onChange }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500">참석자 필수/선택 변경</p>
      <ul className="space-y-1">
        {people
          .filter((p) => !p.is_organizer)
          .map((p) => (
            <li key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{p.name}</span>
              <button
                type="button"
                onClick={() => onChange(p.id, p.attendance === 'required' ? 'optional' : 'required')}
                className="rounded-full border border-slate-300 px-2 py-0.5 text-slate-600"
              >
                {attendanceLabel(p.attendance)}
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}
