import type { Attendance, ChipDay, Person } from '../../types/domain'
import {
  attendanceLabel,
  buildConditionSummary,
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

function dayLabel(day: ChipDay): string {
  return day === '*' ? '매일' : `${day}요일`
}

// 이 화면 전용 시각 표기: 항상 1시간 단위 슬롯("9-10시"/"1-2시") — 연속 시간도 합치지 않고,
// 오전/오후·'낮' 같은 시간대 표현 없이 12시간제 숫자만 쓴다.
function hourSlotLabel(hour: number): string {
  const to12 = (h: number) => (h > 12 ? h - 12 : h)
  return `${to12(hour)}-${to12(hour + 1)}시`
}

interface DayRow {
  day: ChipDay
  slots: { hour: number; typeLabel: string }[]
}

// 출처 안의 조건들을 요일별 행으로 묶고, 각 행의 시간을 1시간 슬롯으로 펼친다.
// 요일 순서 = seed에 나타난 순서(격자 요일 순서와 일치), 슬롯은 시각 오름차순 + 중복 제거.
function groupByDay(items: ConditionSummaryItem[]): DayRow[] {
  const rows: DayRow[] = []
  for (const item of items) {
    let row = rows.find((r) => r.day === item.day)
    if (!row) {
      row = { day: item.day, slots: [] }
      rows.push(row)
    }
    for (const hour of item.hours) {
      if (!row.slots.some((s) => s.hour === hour)) row.slots.push({ hour, typeLabel: item.typeLabel })
    }
  }
  for (const row of rows) row.slots.sort((a, b) => a.hour - b.hour)
  return rows
}

// 출처 카드 — 제목 → 의미 설명 → 흰색 내부 영역(요일별 행) 순서의 위계. 요일은 왼쪽 고정 열,
// 시간은 오른쪽 세로 나열, 행 사이는 얇은 구분선. showType이 참이면(답변 출처) 슬롯 옆에 조건
// 성격을 표시하는데, '옮길 수 있음'(조정가능)만 파란 배지로 강조하고 나머지는 무채 텍스트다 —
// 캘린더 출처는 전부 참석 어려움이라 성격 표기 자체가 없다.
function ConditionSourceCard({
  title,
  subtitle,
  rows,
  showType,
}: {
  title: string
  subtitle: string
  rows: DayRow[]
  showType: boolean
}) {
  return (
    <div className="rounded-card bg-surface-muted p-3">
      <span className="block text-xs font-bold text-ink-500">{title}</span>
      <strong className="mt-heading-gap block text-sm font-bold text-ink-900">{subtitle}</strong>
      <div className="mt-2 divide-y divide-border rounded-chip bg-surface px-3 py-1">
        {rows.map((row) => (
          <div key={row.day} className="flex gap-3 py-2.5">
            <span className="w-14 shrink-0 text-sm font-bold text-ink-900">{dayLabel(row.day)}</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              {row.slots.map((slot) => (
                <div key={slot.hour} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink-700">{hourSlotLabel(slot.hour)}</span>
                  {showType &&
                    (slot.typeLabel === '옮길 수 있음' ? (
                      <span className="shrink-0 whitespace-nowrap rounded-pill bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">
                        옮길 수 있어요
                      </span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap text-xs text-ink-500">{slot.typeLabel}</span>
                    ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 조건 지도에서 선택된 참여자의 상세(12D-4, 참고안 구조) — 헤더(이름·직무·참석 구분 + 상태
// 배지) → 출처별 조건 카드(캘린더에서 확인 / 답변으로 알려줌) → 참석 구분 변경 → 프라이버시
// 안내. 필수/선택 변경은 이 화면(주최자 화면) 안에서만 제공한다.
// 참여자 화면 진입 CTA는 여기 없다 — 실제 제품 UI가 "주최자가 남의 응답을 대신 연다"는 기능처럼
// 보이면 안 되므로, 그 진입점은 자유 모드 체험 레이어(FreeModeControls)에만 둔다.
export function PersonDetailPanel({ person, responded, onChangeAttendance, reported = false }: Props) {
  const [effective] = deriveEffectivePeople([person], { [person.id]: responded })
  const items = buildConditionSummary([effective])
  const calendarRows = groupByDay(items.filter((item) => item.source === '캘린더'))
  const responseItems = items.filter((item) => item.source === '응답')
  const responseRows = groupByDay(responseItems)
  // 답변 출처의 의미 설명 — 전부 조정가능(옮길 수 있음)이면 그 의미를, 아니면 일반 문구를 쓴다.
  const responseSubtitle = responseItems.every((item) => item.typeLabel === '옮길 수 있음')
    ? '캘린더 일정 중 조정할 수 있는 시간이 있어요'
    : '직접 알려준 시간 조건이에요'

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
        {calendarRows.length > 0 && (
          <ConditionSourceCard
            title="캘린더에서 확인"
            subtitle="아래 시간에는 참석이 어려워요"
            rows={calendarRows}
            showType={false}
          />
        )}
        {responseRows.length > 0 ? (
          <ConditionSourceCard title="답변으로 알려줌" subtitle={responseSubtitle} rows={responseRows} showType />
        ) : (
          <div className="rounded-card bg-surface-muted p-3">
            <span className="block text-xs font-bold text-ink-500">답변</span>
            <strong className="mt-1 block text-sm font-bold text-ink-900">
              {responded ? '추가된 시간 조건은 없음' : '아직 답변하지 않았어요'}
            </strong>
          </div>
        )}
        {items.length === 0 && !responded && calendarRows.length === 0 && (
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
