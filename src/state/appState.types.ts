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
  // 확정 시점의 제외 인원 스냅샷 — 확정 후 자유 모드에서 조건이 바뀌어도 확정 화면 표시는 흔들리지 않는다(R8: 잠금+보존).
  excluded: string[]
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
