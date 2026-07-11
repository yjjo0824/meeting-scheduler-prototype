import type { Grid } from '../types/domain'
import type { Slot, SlotKey } from '../types/engine'
import { allSlots, slotKey, sortSlots } from './slotKey'

export function hardBlockers(slot: Slot, groupIds: string[], hard: Record<string, Set<SlotKey>>): string[] {
  const key = slotKey(slot.day, slot.hour)
  return groupIds.filter((id) => hard[id].has(key))
}

export function softViolators(slot: Slot, groupIds: string[], soft: Record<string, Set<SlotKey>>): string[] {
  const key = slotKey(slot.day, slot.hour)
  return groupIds.filter((id) => soft[id].has(key))
}

export function perfectSlots(
  hard: Record<string, Set<SlotKey>>,
  soft: Record<string, Set<SlotKey>>,
  groupIds: string[],
  grid: Grid,
): Slot[] {
  const free = allSlots(grid).filter(
    (slot) => hardBlockers(slot, groupIds, hard).length === 0 && softViolators(slot, groupIds, soft).length === 0,
  )
  return sortSlots(free, grid)
}
