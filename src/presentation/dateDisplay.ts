import type { Day, ScheduleDisplay } from '../types/domain'

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
