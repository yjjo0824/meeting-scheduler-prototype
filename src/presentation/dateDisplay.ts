import type { Day, ScheduleDisplay } from '../types/domain'
import type { Slot } from '../types/engine'

const DAY_OFFSET: Record<Day, number> = { 월: 0, 화: 1, 수: 2, 목: 3, 금: 4 }

export function dateForDay(day: Day, display: ScheduleDisplay): Date {
  const start = new Date(`${display.window_start_date}T00:00:00`)
  const result = new Date(start)
  result.setDate(start.getDate() + DAY_OFFSET[day])
  return result
}

function to12Hour(hour: number): number {
  const h = hour % 12
  return h === 0 ? 12 : h
}

function periodOf(hour: number): '오전' | '오후' {
  return hour < 12 ? '오전' : '오후'
}

export function formatDisplayDate(day: Day, hour: number, display: ScheduleDisplay): string {
  const date = dateForDay(day, display)
  const month = date.getMonth() + 1
  const dayOfMonth = date.getDate()
  const endHour = hour + 1
  return `${month}월 ${dayOfMonth}일(${day}) ${periodOf(hour)} ${to12Hour(hour)}:00–${to12Hour(endHour)}:00`
}

// "오후 1시" — 사용자 언어 시각 표기(24시간제 숫자를 화면에 그대로 내보내지 않는다).
export function formatHourLabel(hour: number): string {
  return `${periodOf(hour)} ${to12Hour(hour)}시`
}

// "금요일 오후 1시" — 후보 카드의 대표 시간·확정 CTA에 쓰는 슬롯 라벨.
export function formatSlotLabel(slot: Slot): string {
  return `${slot.day}요일 ${formatHourLabel(slot.hour)}`
}

// "7월 17일 금요일 오후 1시" — 날짜 포함 표기(12C-12.3부터 표시 레이어에서 미사용 — 삭제하지
// 않고 보존한다. 날짜는 schedule_display에서 파생, 표시 전용 — 엔진은 날짜를 모른다).
export function formatSlotWithDate(slot: Slot, display: ScheduleDisplay): string {
  const date = dateForDay(slot.day, display)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${formatSlotLabel(slot)}`
}

// "금요일 오후 1:00–2:00" — 확정 표기(12C-12.3): 잠정 추천·후보 카드와 같은 요일 체계에
// 시작–종료 시각을 붙인다(날짜 없음).
export function formatSlotTimeRange(slot: Slot): string {
  const endHour = slot.hour + 1
  return `${slot.day}요일 ${periodOf(slot.hour)} ${to12Hour(slot.hour)}:00–${to12Hour(endHour)}:00`
}

// 후보군의 대표 시간 라벨: 같은 요일의 연속 슬롯이면 "수요일 오후 2–5시"처럼 범위로 접고,
// 그 외에는 첫 슬롯 + 나머지 개수로 표기한다(접힌 카드에서도 비교 가능해야 한다는 원칙).
export function formatSlotsRangeLabel(slots: Slot[]): string {
  if (slots.length === 0) return ''
  if (slots.length === 1) return formatSlotLabel(slots[0])

  const sameDay = slots.every((s) => s.day === slots[0].day)
  const hours = slots.map((s) => s.hour)
  const contiguous = hours.every((h, i) => i === 0 || h === hours[i - 1] + 1)

  if (sameDay && contiguous) {
    const first = hours[0]
    const last = hours[hours.length - 1]
    if (periodOf(first) === periodOf(last)) {
      return `${slots[0].day}요일 ${periodOf(first)} ${to12Hour(first)}–${to12Hour(last)}시`
    }
    return `${slots[0].day}요일 ${formatHourLabel(first)}–${formatHourLabel(last)}`
  }

  return `${formatSlotLabel(slots[0])} 외 ${slots.length - 1}개`
}
