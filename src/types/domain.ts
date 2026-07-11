export type Day = '월' | '화' | '수' | '목' | '금'
export type ChipDay = Day | '*'
export type Hour = number

export type Attendance = 'required' | 'optional'
export type ChipType = '불가' | '회피' | '병합' | '조정가능' | '미분류'

export interface CalendarEvent {
  title: string
  day: Day
  hours: Hour[]
}

export interface Chip {
  type: ChipType
  day: ChipDay
  hours: Hour[]
  cue?: string
  target?: string
  note?: string
}

export interface PersonResponse {
  raw: string | null
  chips: Chip[]
  note?: string
}

export interface Person {
  id: string
  name: string
  job: string
  attendance: Attendance
  is_organizer: boolean
  responded_at_demo_start?: boolean
  calendar: CalendarEvent[]
  response: PersonResponse
}

export interface CostWeights {
  optional_preference: number
  required_preference: number
  optional_attendance: number
  inviolable: string[]
  tie_break: string
  invariant: string
}

export interface Grid {
  days: Day[]
  hours: Hour[]
  note: string
}

export interface Meeting {
  title: string
  duration_hours: number
  window: string
  response_deadline: string
  organizer: string
}

export interface ScheduleDisplay {
  note: string
  window_start_date: string
  response_deadline_date: string
}

export interface ExpectedSlot {
  day: Day
  hour: Hour
}

export interface ExpectedCandidateGroup {
  rank: number
  excluded: string[]
  pref_unmet: string[]
  cost: number
  slots: ExpectedSlot[]
  default_slot: ExpectedSlot
  attend_count: string
}

export interface SeedExpected {
  total_slots: number
  perfect_slots_all_responded: ExpectedSlot[]
  all_attend_slots: Array<ExpectedSlot & { soft_violations: string[] }>
  candidates_exclude_doyun: ExpectedSlot[]
  candidates_exclude_sua: ExpectedSlot[]
  pre_doyun_tentative_perfect: ExpectedSlot[]
  recommendation_pre_doyun: ExpectedSlot & { status: string }
  recommendation_post: {
    top: ExpectedSlot & { sacrifice: string; cost: number }
    alternative: ExpectedSlot & { sacrifice: string; cost: number; human_pull: string }
  }
  candidate_groups_post: ExpectedCandidateGroup[]
  escapes: Array<{ action: string; result: ExpectedSlot & { becomes: string } }>
}

export interface Seed {
  meeting: Meeting
  schedule_display: ScheduleDisplay
  grid: Grid
  people: Person[]
  cost_weights: CostWeights
  expected: SeedExpected
}
