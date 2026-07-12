import type { Attendance, Person } from '../../types/domain'
import {
  attendanceLabel,
  buildConditionSummary,
  formatHourRange,
  type ConditionSummaryItem,
} from '../../presentation/conditionCopy'
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

function dayLabel(day: ConditionSummaryItem['day']): string {
  return day === '*' ? '매일' : `${day}요일`
}

// 출처별 문장(12D-4, 참고안 표기) — "월요일 15~16시 · 수요일 9~10시 참석 어려움"처럼 같은
// 성격의 조건은 시간들을 나열하고 성격을 한 번만 말한다. 성격이 섞이면 항목별로 붙인다.
// cue·raw·일정 제목은 어떤 경우에도 포함하지 않는다(R4 — buildConditionSummary가 이미 배제).
function sourceSentence(items: ConditionSummaryItem[]): string {
  const timePart = (item: ConditionSummaryItem) => `${dayLabel(item.day)} ${formatHourRange(item.hours)}`
  const allSameType = items.every((item) => item.typeLabel === items[0].typeLabel)
  if (allSameType) return `${items.map(timePart).join(' · ')} ${items[0].typeLabel}`
  return items.map((item) => `${timePart(item)} ${item.typeLabel}`).join(' · ')
}

// 조건 지도에서 선택된 참여자의 상세(12D-4, 참고안 구조) — 헤더(이름·직무·참석 구분 + 상태
// 배지) → 출처별 조건 카드(캘린더에서 확인 / 답변으로 알려줌) → 참석 구분 변경 → 프라이버시
// 안내. 필수/선택 변경은 이 화면(주최자 화면) 안에서만 제공한다.
// 참여자 화면 진입 CTA는 여기 없다 — 실제 제품 UI가 "주최자가 남의 응답을 대신 연다"는 기능처럼
// 보이면 안 되므로, 그 진입점은 자유 모드 체험 레이어(FreeModeControls)에만 둔다.
export function PersonDetailPanel({ person, responded, onChangeAttendance, reported = false }: Props) {
  const [effective] = deriveEffectivePeople([person], { [person.id]: responded })
  const items = buildConditionSummary([effective])
  const calendarItems = items.filter((item) => item.source === '캘린더')
  const responseItems = items.filter((item) => item.source === '응답')

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-ink-900">{person.name} 님의 시간 조건</h3>
          <p className="mt-heading-gap text-sm text-ink-500">
            {person.job} · {attendanceLabel(person.attendance)} 참석{!responded && ' · 답변 전'}
          </p>
        </div>
        <Badge tone={responded ? 'neutral' : 'warn'}>{responded ? '답변 완료' : '답변 전'}</Badge>
      </div>

      {reported && (
        <p className="rounded-card bg-danger-50 p-3 text-sm font-medium text-danger-600">
          확정된 시간에 참석하기 어렵다고 알려왔어요
        </p>
      )}

      <div className="space-y-3">
        {calendarItems.length > 0 && (
          <div className="rounded-card bg-surface-muted p-3">
            <span className="block text-xs font-bold text-ink-500">캘린더에서 확인</span>
            <strong className="mt-1 block text-sm font-bold text-ink-900">{sourceSentence(calendarItems)}</strong>
          </div>
        )}
        {responseItems.length > 0 ? (
          <div className="rounded-card bg-surface-muted p-3">
            <span className="block text-xs font-bold text-ink-500">답변으로 알려줌</span>
            <strong className="mt-1 block text-sm font-bold text-ink-900">{sourceSentence(responseItems)}</strong>
          </div>
        ) : (
          <div className="rounded-card bg-surface-muted p-3">
            <span className="block text-xs font-bold text-ink-500">답변</span>
            <strong className="mt-1 block text-sm font-bold text-ink-900">
              {responded ? '추가된 시간 조건은 없음' : '아직 답변하지 않았어요'}
            </strong>
          </div>
        )}
        {items.length === 0 && !responded && calendarItems.length === 0 && (
          <p className="text-sm text-ink-500">아직 알려진 조건이 없어요</p>
        )}
      </div>

      {!person.is_organizer && (
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-ink-700">참석 구분</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChangeAttendance(person.attendance === 'required' ? 'optional' : 'required')}
          >
            {attendanceLabel(person.attendance)}
          </Button>
        </div>
      )}

      <p className="border-t border-border pt-3 text-xs text-ink-500">
        주최자에게는 시간 조건만 보여요. 일정 이름, 이유, 작성한 원문은 보이지 않아요.
      </p>
    </Card>
  )
}
