import { useState } from 'react'
import { RAW_SEED } from '../../data/loadSeed'
import { slotKey } from '../../engine/slotKey'
import type { CalendarEvent, Day, Person } from '../../types/domain'
import type { CalendarCorrection, CalendarCorrectionKind } from '../../state/appState.types'

interface Props {
  person: Person
  corrections: Record<string, CalendarCorrection>
  onApplyCorrection: (day: Day, hour: number, kind: CalendarCorrectionKind) => void
  onUndoCorrection: (day: Day, hour: number) => void
}

// '이 시간 비어 있어요'와 '옮길 수 있어요'는 서로 다른 의미의 정정이다 — 이미 적용된 쪽이 무엇인지
// 항상 이 라벨로 구분해 보여준다(둘 다, 'empty'만 특별 취급하지 않는다).
const CORRECTION_KIND_LABEL: Record<CalendarCorrectionKind, string> = {
  empty: '이 시간 비어 있어요',
  movable: '옮길 수 있어요',
}

function collapseEmptyDayRanges(daysWithoutEvents: Day[], allDays: Day[]): string[] {
  const ranges: string[] = []
  let start: Day | null = null
  let prev: Day | null = null

  for (const day of allDays) {
    if (daysWithoutEvents.includes(day)) {
      if (start === null) start = day
      prev = day
    } else if (start !== null) {
      ranges.push(start === prev ? `${start} 일정 없음` : `${start}–${prev} 일정 없음`)
      start = null
      prev = null
    }
  }
  if (start !== null) {
    ranges.push(start === prev ? `${start} 일정 없음` : `${start}–${prev} 일정 없음`)
  }
  return ranges
}

export function CalendarPrefillList({ person, corrections, onApplyCorrection, onUndoCorrection }: Props) {
  const [openEventKey, setOpenEventKey] = useState<string | null>(null)

  const daysWithEvents = new Set(person.calendar.map((e) => e.day))
  const daysWithoutEvents = RAW_SEED.grid.days.filter((d) => !daysWithEvents.has(d))
  const emptyRanges = collapseEmptyDayRanges(daysWithoutEvents, RAW_SEED.grid.days)

  function isEventCorrected(event: CalendarEvent): boolean {
    return event.hours.length > 0 && event.hours.every((h) => corrections[slotKey(event.day, h)])
  }

  return (
    <div className="space-y-2 py-3">
      {person.calendar.map((event) => {
        const key = `${event.day}-${event.title}-${event.hours.join('_')}`
        const corrected = isEventCorrected(event)
        const correctionKind = corrected ? corrections[slotKey(event.day, event.hours[0])]?.kind : undefined

        return (
          <div key={key} className="rounded-lg border border-slate-200 p-2.5 text-sm">
            {corrected ? (
              // 이미 정정이 적용된 일정 — 같은 정정 액션을 다시 실행할 수 없도록 헤더를 완전히
              // 비활성화한다(탭 불가). '실행 취소'만이 상태를 바꿀 수 있는 유일한 경로다.
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full cursor-not-allowed text-left text-slate-400 line-through"
              >
                {event.day} {event.hours.map((h) => `${h}시`).join(', ')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpenEventKey(openEventKey === key ? null : key)}
                className="w-full text-left text-slate-700"
              >
                {event.day} {event.hours.map((h) => `${h}시`).join(', ')}
                <span className="ml-2 text-xs text-slate-400 no-underline">캘린더 · 탭해서 정정</span>
              </button>
            )}

            {corrected ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-indigo-600">정정됨 · {CORRECTION_KIND_LABEL[correctionKind!]}</p>
                <button
                  type="button"
                  className="shrink-0 text-xs text-indigo-600 underline"
                  onClick={() => event.hours.forEach((h) => onUndoCorrection(event.day, h))}
                >
                  실행 취소
                </button>
              </div>
            ) : (
              openEventKey === key && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => {
                      event.hours.forEach((h) => onApplyCorrection(event.day, h, 'empty'))
                      setOpenEventKey(null)
                    }}
                  >
                    이 시간 비어 있어요
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => {
                      event.hours.forEach((h) => onApplyCorrection(event.day, h, 'movable'))
                      setOpenEventKey(null)
                    }}
                  >
                    옮길 수 있어요
                  </button>
                </div>
              )
            )}
            {corrected && correctionKind === 'empty' && (
              <p className="mt-1 text-xs text-indigo-500">사내 캘린더에서 열기</p>
            )}
          </div>
        )
      })}

      {emptyRanges.map((label) => (
        <p key={label} className="text-xs text-slate-400">
          {label}
        </p>
      ))}
    </div>
  )
}
