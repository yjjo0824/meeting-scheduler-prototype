import type { Attendance, Person } from '../../types/domain'
import { attendanceLabel, buildConditionSummary, formatHourRange, groupConditionsByDay } from '../../presentation/conditionCopy'
import { deriveEffectivePeople } from '../../state/useSchedule'
import { Badge } from '../../shared/Badge'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'

interface Props {
  person: Person
  responded: boolean
  onChangeAttendance: (attendance: Attendance) => void
  // 확정 후 이 참여자가 "참석하기 어려워졌어요"를 보냈는지 — 사유·원문은 표시하지 않는다(R4).
  reported?: boolean
}

// 조건 지도에서 선택된 참여자의 상세 — 요일별로 묶은 출처 있는 조건과, (주최자 제외) 필수/선택
// 변경을 한 곳에 모은다. 필수/선택 변경은 이 화면(주최자 화면) 안에서만 제공한다.
// 참여자 화면 진입 CTA는 여기 없다 — 실제 제품 UI가 "주최자가 남의 응답을 대신 연다"는 기능처럼
// 보이면 안 되므로, 그 진입점은 자유 모드 체험 레이어(FreeModeControls)에만 둔다.
export function PersonDetailPanel({ person, responded, onChangeAttendance, reported = false }: Props) {
  const [effective] = deriveEffectivePeople([person], { [person.id]: responded })
  const groups = groupConditionsByDay(buildConditionSummary([effective]))

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink-900">{person.name} 님의 시간 조건</h3>
          <p className="text-sm text-ink-700">
            {person.job} · {attendanceLabel(person.attendance)} 참석{!responded && ' · 답변 전'}
          </p>
        </div>
        <Badge tone={responded ? 'neutral' : 'warn'}>{responded ? '응답 완료' : '미응답'}</Badge>
      </div>

      {reported && (
        <p className="rounded-card bg-danger-50 p-3 text-sm font-medium text-danger-600">
          확정된 시간에 참석하기 어렵다고 알려왔어요
        </p>
      )}

      <div className="space-y-3">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.day} className="rounded-card bg-surface-muted p-3">
              <p className="mb-1.5 text-xs font-bold text-ink-700">{group.day === '매일' ? '매일' : `${group.day}요일`}</p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.key} className="text-sm text-ink-900">
                    <strong className="font-semibold">{formatHourRange(item.hours)} · {item.typeLabel}</strong>
                    <span className="ml-1.5 text-xs text-ink-500">
                      {item.source === '캘린더' ? '캘린더에서 확인' : '답변으로 알려줌'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-700">아직 알려진 조건이 없어요</p>
        )}
      </div>

      {!person.is_organizer && (
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-ink-700">참석 구분</span>
          <Button
            variant="secondary"
            onClick={() => onChangeAttendance(person.attendance === 'required' ? 'optional' : 'required')}
          >
            {attendanceLabel(person.attendance)}
          </Button>
        </div>
      )}

      <p className="border-t border-border pt-3 text-xs text-ink-700">
        주최자에게는 시간 조건만 보여요. 일정 이름, 이유, 작성한 원문은 보이지 않아요.
      </p>
    </Card>
  )
}
