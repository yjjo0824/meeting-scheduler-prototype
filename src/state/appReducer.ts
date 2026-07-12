import { RAW_SEED } from '../data/loadSeed'
import { getViewportWidth, isNarrowViewport } from '../shared/useIsNarrowViewport'
import { applyCalendarCorrections } from './useSchedule'
import type { AppState } from './appState.types'
import type { Action } from './actions'

export function buildInitialState(): AppState {
  const people = structuredClone(RAW_SEED.people)
  const hasResponded: Record<string, boolean> = {}
  for (const person of RAW_SEED.people) {
    hasResponded[person.id] = person.responded_at_demo_start !== false
  }

  // 투어의 기준 경험은 데스크톱이다(IMPLEMENTATION_SPEC §1) — 앱이 처음 뜨는 시점에 이미 좁은
  // 화면이면 가이드 투어를 시작하지 않고 자유 조회 상태로 둔다. tour.active의 "의미"는 그대로
  // 두고 초기값 계산만 뷰포트를 참고한다(새 액션·새 상태 필드 없음). SSR/테스트 환경(window 없음)은
  // 항상 데스크톱 폭으로 간주되어 기존 동작(tour.active: true)이 그대로 유지된다.
  const startsNarrow = isNarrowViewport(getViewportWidth())

  return {
    people,
    hasResponded,
    calendarCorrections: {},
    phoneFrame: { open: false, viewingPersonId: null },
    screen: 'host',
    tour: { active: !startsNarrow, stepIndex: 0 },
    selectedSlotByGroup: {},
    confirmedMeeting: null,
    freeModeUnlocked: false,
    reportedByPersonId: {},
    exampleFillSignal: 0,
  }
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SUBMIT_RESPONSE': {
      const targetPerson = state.people.find((p) => p.id === action.personId)
      const corrections = action.corrections ?? state.calendarCorrections[action.personId] ?? {}

      // 정정([이 시간 비어 있어요]/[옮길 수 있어요])으로 이미 풀린 슬롯을 가리키던 병합·조정가능
      // 칩은 제출 시점에 함께 정리한다 — 원본 캘린더는 손대지 않고(R5), 모순된 두 조건이 동시에
      // 활성 상태로 보이지 않게 한다. applyCalendarCorrections는 계산용으로 이미 검증된 로직을
      // 그대로 재사용하되, 여기서는 결과의 chips만 취하고 calendar(원본)는 버린다.
      const cleanedChips = targetPerson
        ? applyCalendarCorrections(
            [{ ...targetPerson, response: { ...targetPerson.response, chips: action.chips } }],
            { [action.personId]: corrections },
            RAW_SEED.grid,
          )[0].response.chips
        : action.chips

      const people = state.people.map((p) =>
        p.id === action.personId
          ? { ...p, response: { ...p.response, chips: cleanedChips, raw: action.raw ?? p.response.raw } }
          : p,
      )

      return {
        ...state,
        people,
        hasResponded: { ...state.hasResponded, [action.personId]: true },
        calendarCorrections: { ...state.calendarCorrections, [action.personId]: corrections },
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
        confirmedMeeting: { groupKey: action.groupKey, slot: action.slot, excluded: action.excluded },
        screen: 'confirmation',
      }
    case 'REOPEN_FOR_RESCHEDULE':
      // R8: 재조율은 전체 재수집이 아니라 재계산 한 번 — people/응답 데이터는 그대로 보존한다.
      return { ...state, confirmedMeeting: null, screen: 'host' }
    case 'UNLOCK_FREE_MODE':
      return { ...state, freeModeUnlocked: true, tour: { ...state.tour, active: false } }
    case 'SET_TOUR_STEP':
      return { ...state, tour: { ...state.tour, stepIndex: action.stepIndex } }
    case 'REQUEST_EXAMPLE_FILL':
      return { ...state, exampleFillSignal: state.exampleFillSignal + 1 }
    case 'RESET_ALL':
      return buildInitialState()
    default:
      return state
  }
}
