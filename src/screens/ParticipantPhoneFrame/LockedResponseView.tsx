import { useState } from 'react'
import { buildConditionSummary, formatHourRange, groupConditionsByDay } from '../../presentation/conditionCopy'
import { formatDisplayDate } from '../../presentation/dateDisplay'
import { Button } from '../../shared/Button'
import type { Person, ScheduleDisplay } from '../../types/domain'
import type { Slot } from '../../types/engine'

interface Props {
  person: Person
  slot: Slot
  display: ScheduleDisplay
  organizerName: string
  reported: boolean
  onReport: () => void
}

// R8 잠금 상태: 확정 결과(사람이 궁금한 것)를 시스템 상태 설명보다 먼저 보여준다.
// 날짜는 seed.schedule_display + 확정 슬롯에서 파생한다(표시 전용 — 엔진은 날짜를 모른다).
export function LockedResponseView({ person, slot, display, organizerName, reported, onReport }: Props) {
  const [justReported, setJustReported] = useState(false)
  const groups = groupConditionsByDay(buildConditionSummary([person]))

  return (
    <div className="space-y-3 py-4 text-sm text-ink-700">
      <p className="text-base font-bold text-ink-900">회의 시간이 정해졌어요</p>
      <p className="text-sm font-bold text-brand-600">{formatDisplayDate(slot.day, slot.hour, display)}</p>
      <p className="text-xs text-ink-500">이제 응답은 수정할 수 없어요.</p>

      <p className="pt-1 text-xs font-bold text-ink-900">전달한 시간 조건</p>
      {groups.length > 0 ? (
        <ul className="space-y-2 rounded-chip bg-surface-muted p-3 text-xs text-ink-700">
          {groups.map((group) => (
            <li key={group.day}>
              <p className="font-bold text-ink-900">{group.day === '매일' ? '매일' : `${group.day}요일`}</p>
              <ul className="mt-0.5 space-y-0.5 pl-2">
                {group.items.map((item) => (
                  <li key={item.key}>
                    {formatHourRange(item.hours)} · {item.typeLabel}
                    {item.cue && <span className="text-ink-500"> · {item.cue}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-500">추가 조건 없이 캘린더 일정만 반영했어요</p>
      )}

      <Button
        variant="secondary"
        size="sm"
        disabled={reported}
        onClick={() => {
          onReport()
          setJustReported(true)
        }}
      >
        이 시간에 참석하기 어려워졌어요
      </Button>
      {(reported || justReported) && (
        <p className="text-xs text-brand-600">
          {organizerName} 님에게 알렸어요. 다시 조율할지는 주최자가 결정해요.
        </p>
      )}
    </div>
  )
}
