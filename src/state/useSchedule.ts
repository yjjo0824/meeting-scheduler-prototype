import { useMemo } from 'react'
import { RAW_SEED } from '../data/loadSeed'
import { computeSchedule } from '../engine/computeSchedule'
import type { Person } from '../types/domain'
import type { ScheduleResult } from '../types/engine'
import type { AppState } from './appState.types'

// R7 디폴트: hasResponded가 false인 사람은 응답이 아직 없는 것으로 간주해 chips를 비운다.
// computeSchedule 자체는 이 플래그를 모른다 — "응답 전" 처리는 상태 레이어의 책임이다.
export function deriveEffectivePeople(people: Person[], hasResponded: Record<string, boolean>): Person[] {
  return people.map((p) => (hasResponded[p.id] ? p : { ...p, response: { ...p.response, chips: [] } }))
}

export function useSchedule(state: AppState): ScheduleResult {
  return useMemo(
    () => computeSchedule(RAW_SEED, deriveEffectivePeople(state.people, state.hasResponded)),
    [state.people, state.hasResponded],
  )
}
