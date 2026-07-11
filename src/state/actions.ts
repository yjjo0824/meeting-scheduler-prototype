import type { Attendance, Chip, Day } from '../types/domain'
import type { Slot } from '../types/engine'
import type { CalendarCorrectionKind, ScreenId } from './appState.types'

export type Action =
  | { type: 'SUBMIT_RESPONSE'; personId: string; chips: Chip[]; raw?: string | null }
  | { type: 'UPDATE_CHIPS'; personId: string; chips: Chip[] }
  | { type: 'APPLY_CALENDAR_CORRECTION'; personId: string; day: Day; hour: number; kind: CalendarCorrectionKind }
  | { type: 'UNDO_CALENDAR_CORRECTION'; personId: string; day: Day; hour: number }
  | { type: 'SET_ATTENDANCE'; personId: string; attendance: Attendance }
  | { type: 'REPORT_UNAVAILABLE'; personId: string }
  | { type: 'OPEN_PHONE_FRAME'; personId: string }
  | { type: 'CLOSE_PHONE_FRAME' }
  | { type: 'NAVIGATE'; screen: ScreenId }
  | { type: 'SELECT_SLOT'; groupKey: string; slot: Slot }
  | { type: 'CONFIRM_MEETING'; groupKey: string; slot: Slot; excluded: string[] }
  | { type: 'REOPEN_FOR_RESCHEDULE' }
  | { type: 'UNLOCK_FREE_MODE' }
  | { type: 'SET_TOUR_STEP'; stepIndex: number }
  | { type: 'RESET_ALL' }
