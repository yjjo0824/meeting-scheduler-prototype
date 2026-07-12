import { useState } from 'react'
import { RAW_SEED } from '../../data/loadSeed'
import { slotKey } from '../../engine/slotKey'
import { formatHourLabel } from '../../presentation/dateDisplay'
import type { CalendarEvent, Day, Person } from '../../types/domain'
import type { CalendarCorrection, CalendarCorrectionKind } from '../../state/appState.types'
import { PhoneEmptyNotice } from './PhoneEmptyNotice'

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
      ranges.push(start === prev ? `${start}` : `${start}–${prev}`)
      start = null
      prev = null
    }
  }
  if (start !== null) {
    ranges.push(start === prev ? `${start}` : `${start}–${prev}`)
  }
  return ranges
}

// "오후 5시" / "오전 9–10시" — 이벤트 시간을 사용자 언어로(후보 카드와 같은 시작 시각 범위 관례).
function eventHoursLabel(hours: number[]): string {
  if (hours.length === 0) return ''
  if (hours.length === 1) return formatHourLabel(hours[0])
  const first = formatHourLabel(hours[0])
  const last = formatHourLabel(hours[hours.length - 1])
  const samePeriod = first.split(' ')[0] === last.split(' ')[0]
  return samePeriod ? `${first}–${last.split(' ')[1]}` : `${first}–${last}`
}

// 하늘의 금요일 14시처럼, 원본 응답에 이미 '조정가능'(옮길 수 있어요) 칩이 있는 슬롯은 새로 같은
// 정정을 또 적용할 필요가 없다 — 이 경우 [옮길 수 있어요] 버튼만 비활성화한다. [이 시간 비어
// 있어요]는 별도의, 아직 적용되지 않은 액션이라 계속 선택할 수 있어야 한다.
export function isEventPreMarkedMovable(event: CalendarEvent, person: Person): boolean {
  return (
    event.hours.length > 0 &&
    event.hours.every((h) =>
      person.response.chips.some(
        (chip) => chip.type === '조정가능' && (chip.day === event.day || chip.day === '*') && chip.hours.includes(h),
      ),
    )
  )
}

// 이벤트의 모든 시간이 같은 kind로 정정돼 있을 때만 "이 이벤트는 이 kind로 정정됨"으로 본다
// (현재 UI는 이벤트 전체를 한 번에 정정한다 — onApplyCorrection이 event.hours 전부를 순회해 호출됨).
export function appliedCorrectionKind(
  event: CalendarEvent,
  corrections: Record<string, CalendarCorrection>,
): CalendarCorrectionKind | undefined {
  if (event.hours.length === 0) return undefined
  const first = corrections[slotKey(event.day, event.hours[0])]?.kind
  if (!first) return undefined
  const allSameKind = event.hours.every((h) => corrections[slotKey(event.day, h)]?.kind === first)
  return allSameKind ? first : undefined
}

// 캘린더 확인 섹션(12D-1, 참고안 구조) — 섹션 제목 + 설명 + 이벤트 카드(요일 라벨 · 정정하기
// 어포던스 · 시간·제목). 일정 제목은 본인 캘린더라 본인 화면에는 보여도 된다(R4는 타인 비노출).
// 정정 플로우(정정 2종·취소선·실행 취소·사내 캘린더 링크)는 현행 그대로다.
export function CalendarPrefillList({ person, corrections, onApplyCorrection, onUndoCorrection }: Props) {
  const [openEventKey, setOpenEventKey] = useState<string | null>(null)

  const daysWithEvents = new Set(person.calendar.map((e) => e.day))
  const daysWithoutEvents = RAW_SEED.grid.days.filter((d) => !daysWithEvents.has(d))
  const emptyRanges = collapseEmptyDayRanges(daysWithoutEvents, RAW_SEED.grid.days)

  return (
    <section className="py-4">
      <h3 className="text-lg font-bold tracking-tight text-ink-900">캘린더에서 가져왔어요</h3>
      <p className="mt-heading-gap text-xs text-ink-500">다른 내용이 있으면 눌러서 알려주세요.</p>
      <div className="mt-2 space-y-2">
        {person.calendar.map((event) => {
          const key = `${event.day}-${event.title}-${event.hours.join('_')}`
          const appliedKind = appliedCorrectionKind(event, corrections)
          const corrected = appliedKind !== undefined
          const movableDisabled = isEventPreMarkedMovable(event, person)

          return (
            <div key={key} className="rounded-chip border border-border bg-surface p-3">
              {corrected ? (
                // 이미 정정이 적용된 일정 — 같은 정정 액션을 다시 실행할 수 없도록 헤더를 완전히
                // 비활성화한다(탭 불가). '실행 취소'만이 상태를 바꿀 수 있는 유일한 경로다.
                <button type="button" disabled aria-disabled="true" className="w-full cursor-not-allowed text-left">
                  <span className="flex justify-between text-xs font-bold text-ink-500">
                    <span>{event.day}요일</span>
                  </span>
                  <span className="mt-1 block text-sm font-bold text-ink-500 line-through">
                    {eventHoursLabel(event.hours)} · {event.title}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenEventKey(openEventKey === key ? null : key)}
                  className="w-full rounded-chip text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <span className="flex justify-between text-xs font-bold">
                    <span className="text-ink-700">{event.day}요일</span>
                    <span className="text-ink-500">정정하기 ›</span>
                  </span>
                  <span className="mt-1 block text-sm font-bold text-ink-900">
                    {eventHoursLabel(event.hours)} · {event.title}
                  </span>
                </button>
              )}

              {corrected ? (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-brand-600">정정됨 · {CORRECTION_KIND_LABEL[appliedKind!]}</p>
                  <button
                    type="button"
                    className="shrink-0 px-1 py-1.5 text-xs text-brand-600 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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
                      className="h-control-sm rounded-chip border border-border px-3 text-xs text-ink-700 hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      onClick={() => {
                        event.hours.forEach((h) => onApplyCorrection(event.day, h, 'empty'))
                        setOpenEventKey(null)
                      }}
                    >
                      이 시간 비어 있어요
                    </button>
                    <button
                      type="button"
                      disabled={movableDisabled}
                      aria-disabled={movableDisabled}
                      title={movableDisabled ? '이미 옮길 수 있는 일정으로 알려져 있어요' : undefined}
                      className={`h-control-sm rounded-chip border px-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                        movableDisabled
                          ? 'cursor-not-allowed border-border text-ink-500 opacity-50'
                          : 'border-border text-ink-700 hover:bg-surface-muted'
                      }`}
                      onClick={() => {
                        // disabled 속성 외에도 핸들러 자체에서 한 번 더 막는다(방어적 이중 체크).
                        if (movableDisabled) return
                        event.hours.forEach((h) => onApplyCorrection(event.day, h, 'movable'))
                        setOpenEventKey(null)
                      }}
                    >
                      옮길 수 있어요
                    </button>
                  </div>
                )
              )}
              {corrected && appliedKind === 'empty' && (
                <p className="mt-1 text-xs text-brand-600">사내 캘린더에서 열기</p>
              )}
            </div>
          )
        })}

        {emptyRanges.map((label) => (
          <PhoneEmptyNotice key={label}>{label}에는 등록된 일정이 없어요</PhoneEmptyNotice>
        ))}
      </div>
    </section>
  )
}
