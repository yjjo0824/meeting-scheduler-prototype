export type SlotState = 'hard' | 'avoid' | 'flexible' | 'available'

interface ConditionSetsLike {
  hard: Record<string, Set<string>>
  soft: Record<string, Set<string>>
  flexible: Record<string, Set<string>>
}

// engine/conditionSets.ts의 hard/soft/flexible을 그대로 셀 상태로 매핑한다 — 엔진 계산은 손대지 않고
// 표시 레이어에서만 분류한다. flexible이 hard의 메타데이터라도 지도에서는 구분되는 색으로 보여준다.
export function classifySlot(personId: string, key: string, sets: ConditionSetsLike): SlotState {
  if (sets.flexible[personId]?.has(key)) return 'flexible'
  if (sets.hard[personId]?.has(key)) return 'hard'
  if (sets.soft[personId]?.has(key)) return 'avoid'
  return 'available'
}
