import type { Day, Hour } from './domain'

export type SlotKey = string

export interface Slot {
  day: Day
  hour: Hour
}

export interface Candidate {
  slot: Slot
  cost: number
  excluded: string[]
  prefUnmet: string[]
  groupKey: string
}

export interface CandidateGroup {
  key: string
  excluded: string[]
  prefUnmet: string[]
  cost: number
  slots: Slot[]
  defaultSlot: Slot
  attendingCount: number
  totalInvited: number
}

export interface ScheduleResult {
  perfectSlots: Slot[]
  candidates: Candidate[]
  groups: CandidateGroup[]
}
