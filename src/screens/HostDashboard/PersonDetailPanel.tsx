import type { Attendance, Person } from '../../types/domain'
import { attendanceLabel, buildConditionSummary } from '../../presentation/conditionCopy'
import { deriveEffectivePeople } from '../../state/useSchedule'
import { Badge } from '../../shared/Badge'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'

interface Props {
  person: Person
  responded: boolean
  onOpenPhoneFrame: () => void
  onChangeAttendance: (attendance: Attendance) => void
}

// 조건 지도에서 선택된 참여자의 상세 — 출처가 붙은 조건, 참여자 화면 진입 CTA, (주최자 제외)
// 필수/선택 변경을 한 곳에 모은다. 필수/선택 변경은 이 화면(주최자 화면) 안에서만 제공한다.
export function PersonDetailPanel({ person, responded, onOpenPhoneFrame, onChangeAttendance }: Props) {
  const [effective] = deriveEffectivePeople([person], { [person.id]: responded })
  const items = buildConditionSummary([effective])

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

      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.key} className="rounded-card bg-surface-muted p-3">
              <span className="mb-1 block text-[11px] font-bold text-ink-700">
                {item.source === '캘린더' ? '캘린더에서 확인' : '답변으로 알려줌'}
              </span>
              <strong className="block text-sm font-semibold text-ink-900">{item.text}</strong>
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

      <Button variant="primary" onClick={onOpenPhoneFrame} className="w-full">
        참여자 화면 보기
      </Button>

      <p className="border-t border-border pt-3 text-xs text-ink-700">
        주최자에게는 시간 조건만 보여요. 일정 이름, 이유, 작성한 원문은 보이지 않아요.
      </p>
    </Card>
  )
}
