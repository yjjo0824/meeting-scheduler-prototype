import type { Person } from '../types/domain'
import type { Slot } from '../types/engine'

export type ScreenId = 'host' | 'tradeoff' | 'confirmation'

export interface PhoneFrameState {
  open: boolean
  viewingPersonId: string | null
}

export interface TourState {
  active: boolean
  stepIndex: number
}

export interface ConfirmedMeeting {
  groupKey: string
  slot: Slot
}

export type CalendarCorrectionKind = 'empty' | 'movable'

export interface CalendarCorrection {
  kind: CalendarCorrectionKind
}

export interface AppState {
  people: Person[]
  hasResponded: Record<string, boolean>
  calendarCorrections: Record<string, Record<string, CalendarCorrection>>
  phoneFrame: PhoneFrameState
  screen: ScreenId
  tour: TourState
  selectedSlotByGroup: Record<string, Slot>
  confirmedMeeting: ConfirmedMeeting | null
  freeModeUnlocked: boolean
  reportedByPersonId: Record<string, boolean>
}
