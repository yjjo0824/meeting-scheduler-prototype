import type { Chip, Grid, Person } from '../types/domain'
import type { SlotKey } from '../types/engine'
import { assertInvariant } from './invariants'
import { slotKey } from './slotKey'

export interface ConditionSets {
  hard: Record<string, Set<SlotKey>>
  soft: Record<string, Set<SlotKey>>
  flexible: Record<string, Set<SlotKey>>
  attendanceById: Record<string, Person['attendance']>
  requiredIds: string[]
  optionalIds: string[]
  allIds: string[]
}

function expandChip(chip: Chip, grid: Grid): Set<SlotKey> {
  const days = chip.day === '*' ? grid.days : [chip.day]
  const keys = new Set<SlotKey>()
  for (const day of days) {
    for (const hour of chip.hours) {
      keys.add(slotKey(day, hour))
    }
  }
  return keys
}

function isSubset(subset: Set<SlotKey>, superset: Set<SlotKey>): boolean {
  for (const key of subset) {
    if (!superset.has(key)) return false
  }
  return true
}

export function buildConditionSets(people: Person[], grid: Grid): ConditionSets {
  const hard: Record<string, Set<SlotKey>> = {}
  const soft: Record<string, Set<SlotKey>> = {}
  const flexible: Record<string, Set<SlotKey>> = {}
  const attendanceById: Record<string, Person['attendance']> = {}

  for (const person of people) {
    attendanceById[person.id] = person.attendance

    const personHard = new Set<SlotKey>()
    for (const event of person.calendar) {
      for (const hour of event.hours) {
        personHard.add(slotKey(event.day, hour))
      }
    }
    hard[person.id] = personHard
    soft[person.id] = new Set()
    flexible[person.id] = new Set()

    for (const chip of person.response.chips) {
      const expanded = expandChip(chip, grid)

      if (chip.type === '불가') {
        for (const key of expanded) hard[person.id].add(key)
      } else if (chip.type === '회피') {
        for (const key of expanded) soft[person.id].add(key)
      } else if (chip.type === '병합') {
        assertInvariant(
          isSubset(expanded, hard[person.id]),
          `병합 칩 오류: ${person.id} ${JSON.stringify(chip)} — 캘린더에 없는 슬롯`,
        )
      } else if (chip.type === '조정가능') {
        assertInvariant(
          isSubset(expanded, hard[person.id]),
          `조정가능 칩 오류: ${person.id} ${JSON.stringify(chip)} — 하드 제약이 아님`,
        )
        for (const key of expanded) flexible[person.id].add(key)
      }
    }
  }

  const requiredIds = people.filter((p) => p.attendance === 'required').map((p) => p.id)
  const optionalIds = people.filter((p) => p.attendance === 'optional').map((p) => p.id)
  const allIds = [...requiredIds, ...optionalIds]

  return { hard, soft, flexible, attendanceById, requiredIds, optionalIds, allIds }
}
