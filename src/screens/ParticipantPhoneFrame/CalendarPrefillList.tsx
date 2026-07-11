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
            <button
              type="button"
              onClick={() => setOpenEventKey(openEventKey === key ? null : key)}
              className={`w-full text-left ${corrected ? 'text-slate-400 line-through' : 'text-slate-700'}`}
            >
              {event.day} {event.hours.map((h) => `${h}시`).join(', ')}
              <span className="ml-2 text-xs text-slate-400 no-underline">캘린더 · 탭해서 정정</span>
            </button>

            {corrected ? (
              <div className="mt-2 space-y-1">
                <button
                  type="button"
                  className="text-xs text-indigo-600 underline"
                  onClick={() => event.hours.forEach((h) => onUndoCorrection(event.day, h))}
                >
                  실행 취소
                </button>
                {correctionKind === 'empty' && (
                  <p className="text-xs text-indigo-500">사내 캘린더에서 열기</p>
                )}
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
