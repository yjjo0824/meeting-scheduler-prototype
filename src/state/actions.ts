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
  // keepTourActive: 모바일 진입으로 인한 강제 잠금 해제 전용 플래그(기본 false) — 데스크톱
  // 투어 4단계 CTA와 Esc 종료는 그대로 tour.active까지 끈다. 모바일 폭에서는 시각적 투어만
  // 끄는 것이지 투어 자체를 완료시키는 게 아니므로, 이 값을 true로 넘기면 tour 상태는 건드리지
  // 않는다(데스크톱으로 되돌아오면 하던 단계 그대로 이어간다).
  | { type: 'UNLOCK_FREE_MODE'; keepTourActive?: boolean }
  | { type: 'SET_TOUR_STEP'; stepIndex: number }
  | { type: 'REQUEST_EXAMPLE_FILL' }
  | { type: 'RESET_ALL' }
