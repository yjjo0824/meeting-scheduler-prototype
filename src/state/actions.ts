import type { Attendance, Chip } from '../types/domain'
import type { Slot } from '../types/engine'
import type { CalendarCorrection, ScreenId } from './appState.types'

export type Action =
  // corrections가 있으면 그 사람의 캘린더 정정도 이 시점에 함께 커밋한다(draft → 한 번에 commit).
  | {
      type: 'SUBMIT_RESPONSE'
      personId: string
      chips: Chip[]
      raw?: string | null
      corrections?: Record<string, CalendarCorrection>
    }
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
  | { type: 'REQUEST_EXAMPLE_FILL' }
  | { type: 'RESET_ALL' }
