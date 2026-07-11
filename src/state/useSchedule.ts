import { useMemo } from 'react'
import { RAW_SEED } from '../data/loadSeed'
import { computeSchedule } from '../engine/computeSchedule'
import { slotKey } from '../engine/slotKey'
import type { Grid, Person } from '../types/domain'
import type { ScheduleResult } from '../types/engine'
import type { AppState } from './appState.types'

// R7 디폴트: hasResponded가 false인 사람은 응답이 아직 없는 것으로 간주해 chips를 비운다.
// computeSchedule 자체는 이 플래그를 모른다 — "응답 전" 처리는 상태 레이어의 책임이다.
export function deriveEffectivePeople(people: Person[], hasResponded: Record<string, boolean>): Person[] {
  return people.map((p) => (hasResponded[p.id] ? p : { ...p, response: { ...p.response, chips: [] } }))
}

function isChipStillOnCalendar(chip: Person['response']['chips'][number], calendarKeys: Set<string>, grid: Grid): boolean {
  const days = chip.day === '*' ? grid.days : [chip.day]
  return days.every((day) => chip.hours.every((h) => calendarKeys.has(slotKey(day, h))))
}

// R5/R6: 정정 칩([이 시간 비어 있어요]/[옮길 수 있어요])은 원본 캘린더를 바꾸지 않고
// "이 회의의 계산 레이어"에만 반영한다 — 여기서 person.calendar를 복제해 보정된 슬롯만 제거한다.
// 캘린더가 줄어들면 그 슬롯을 가리키던 병합·조정가능 칩도 더 이상 하드 제약의 부분집합이 아니게
// 되므로(엔진의 subset invariant), 함께 걸러낸다 — 정정으로 이미 풀린 제약을 다시 메타로 들고 있을 이유가 없다.
export function applyCalendarCorrections(
  people: Person[],
  corrections: AppState['calendarCorrections'],
  grid: Grid,
): Person[] {
  return people.map((p) => {
    const personCorrections = corrections[p.id]
    if (!personCorrections || Object.keys(personCorrections).length === 0) return p

    const calendar = p.calendar
      .map((event) => ({
        ...event,
        hours: event.hours.filter((h) => !personCorrections[slotKey(event.day, h)]),
      }))
      .filter((event) => event.hours.length > 0)

    const calendarKeys = new Set<string>()
    for (const event of calendar) {
      for (const hour of event.hours) calendarKeys.add(slotKey(event.day, hour))
    }

    const chips = p.response.chips.filter((chip) => {
      if (chip.type !== '병합' && chip.type !== '조정가능') return true
      return isChipStillOnCalendar(chip, calendarKeys, grid)
    })

    return { ...p, calendar, response: { ...p.response, chips } }
  })
}

export function useSchedule(state: AppState): ScheduleResult {
  return useMemo(() => {
    const corrected = applyCalendarCorrections(state.people, state.calendarCorrections, RAW_SEED.grid)
    const effective = deriveEffectivePeople(corrected, state.hasResponded)
    return computeSchedule(RAW_SEED, effective)
  }, [state.people, state.hasResponded, state.calendarCorrections])
}
