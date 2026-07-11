import type { CalendarEvent, Grid } from '../types/domain'

export interface ParseChipsInput {
  raw: string
  calendarEvents: CalendarEvent[]
  grid: Grid
}
