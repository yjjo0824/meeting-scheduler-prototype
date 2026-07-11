import type { Day, Grid, Hour } from '../types/domain'
import type { Slot, SlotKey } from '../types/engine'

export function slotKey(day: Day, hour: Hour): SlotKey {
  return `${day}#${hour}`
}

export function parseSlotKey(key: SlotKey): Slot {
  const [day, hour] = key.split('#')
  return { day: day as Day, hour: Number(hour) }
}

export function allSlots(grid: Grid): Slot[] {
  const slots: Slot[] = []
  for (const day of grid.days) {
    for (const hour of grid.hours) {
      slots.push({ day, hour })
    }
  }
  return slots
}

export function sortSlots(slots: Slot[], grid: Grid): Slot[] {
  return [...slots].sort((a, b) => {
    const dayDiff = grid.days.indexOf(a.day) - grid.days.indexOf(b.day)
    if (dayDiff !== 0) return dayDiff
    return a.hour - b.hour
  })
}
