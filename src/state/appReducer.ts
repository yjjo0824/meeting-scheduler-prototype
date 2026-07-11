import { RAW_SEED } from '../data/loadSeed'
import { slotKey } from '../engine/slotKey'
import type { AppState } from './appState.types'
import type { Action } from './actions'

export function buildInitialState(): AppState {
  const people = structuredClone(RAW_SEED.people)
  const hasResponded: Record<string, boolean> = {}
  for (const person of RAW_SEED.people) {
    hasResponded[person.id] = person.responded_at_demo_start !== false
  }

  return {
    people,
    hasResponded,
    calendarCorrections: {},
    phoneFrame: { open: false, viewingPersonId: null },
    screen: 'host',
    tour: { active: true, stepIndex: 0 },
    selectedSlotByGroup: {},
    confirmedMeeting: null,
    freeModeUnlocked: false,
    reportedByPersonId: {},
  }
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SUBMIT_RESPONSE': {
      const people = state.people.map((p) =>
        p.id === action.personId
          ? { ...p, response: { ...p.response, chips: action.chips, raw: action.raw ?? p.response.raw } }
          : p,
      )
      return { ...state, people, hasResponded: { ...state.hasResponded, [action.personId]: true } }
    }
    case 'UPDATE_CHIPS': {
      const people = state.people.map((p) =>
        p.id === action.personId ? { ...p, response: { ...p.response, chips: action.chips } } : p,
      )
      return { ...state, people }
    }
    case 'APPLY_CALENDAR_CORRECTION': {
      const key = slotKey(action.day, action.hour)
      const personCorrections = { ...(state.calendarCorrections[action.personId] ?? {}) }
      personCorrections[key] = { kind: action.kind }
      return {
        ...state,
        calendarCorrections: { ...state.calendarCorrections, [action.personId]: personCorrections },
      }
    }
    case 'UNDO_CALENDAR_CORRECTION': {
      const key = slotKey(action.day, action.hour)
      const personCorrections = { ...(state.calendarCorrections[action.personId] ?? {}) }
      delete personCorrections[key]
      return {
        ...state,
        calendarCorrections: { ...state.calendarCorrections, [action.personId]: personCorrections },
      }
    }
    case 'SET_ATTENDANCE': {
      const people = state.people.map((p) => (p.id === action.personId ? { ...p, attendance: action.attendance } : p))
      return { ...state, people }
    }
    case 'REPORT_UNAVAILABLE':
      return { ...state, reportedByPersonId: { ...state.reportedByPersonId, [action.personId]: true } }
    case 'OPEN_PHONE_FRAME':
      return { ...state, phoneFrame: { open: true, viewingPersonId: action.personId } }
    case 'CLOSE_PHONE_FRAME':
      return { ...state, phoneFrame: { open: false, viewingPersonId: null } }
    case 'NAVIGATE':
      return { ...state, screen: action.screen }
    case 'SELECT_SLOT':
      return { ...state, selectedSlotByGroup: { ...state.selectedSlotByGroup, [action.groupKey]: action.slot } }
    case 'CONFIRM_MEETING':
      return {
        ...state,
        confirmedMeeting: { groupKey: action.groupKey, slot: action.slot },
        screen: 'confirmation',
      }
    case 'UNLOCK_FREE_MODE':
      return { ...state, freeModeUnlocked: true, tour: { ...state.tour, active: false } }
    case 'SET_TOUR_STEP':
      return { ...state, tour: { ...state.tour, stepIndex: action.stepIndex } }
    case 'RESET_ALL':
      return buildInitialState()
    default:
      return state
  }
}
