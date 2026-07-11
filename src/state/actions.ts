import type { Chip } from '../types/domain'
import type { Slot } from '../types/engine'
import type { ScreenId } from './appState.types'

export type Action =
  | { type: 'SUBMIT_RESPONSE'; personId: string; chips: Chip[]; raw?: string | null }
  | { type: 'OPEN_PHONE_FRAME'; personId: string }
  | { type: 'CLOSE_PHONE_FRAME' }
  | { type: 'NAVIGATE'; screen: ScreenId }
  | { type: 'SELECT_SLOT'; groupKey: string; slot: Slot }
  | { type: 'CONFIRM_MEETING'; groupKey: string; slot: Slot }
  | { type: 'UNLOCK_FREE_MODE' }
  | { type: 'SET_TOUR_STEP'; stepIndex: number }
  | { type: 'RESET_ALL' }
