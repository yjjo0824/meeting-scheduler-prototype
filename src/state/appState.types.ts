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

export interface AppState {
  people: Person[]
  hasResponded: Record<string, boolean>
  phoneFrame: PhoneFrameState
  screen: ScreenId
  tour: TourState
  selectedSlotByGroup: Record<string, Slot>
  confirmedMeeting: ConfirmedMeeting | null
  freeModeUnlocked: boolean
}
