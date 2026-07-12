import type { Day, Person } from '../types/domain'
import type { CandidateGroup, Slot } from '../types/engine'
import { attendanceLabel } from './conditionCopy'

const ALL_DAYS: Day[] = ['월', '화', '수', '목', '금']

function personName(id: string, people: Person[]): string {
  return people.find((p) => p.id === id)?.name ?? id
}

// 플랫 정보 줄의 긍정 문구(12C-12) — 이 안이 지켜주는 것을 먼저 말한다. cost 숫자는 절대 읽지 않는다.
export function formatPositiveLine(group: CandidateGroup): string {
  if (group.excluded.length === 0) return `${group.totalInvited}명 모두 참석할 수 있어요`
  if (group.prefUnmet.length === 0) return `참석하는 ${group.attendingCount}명의 선호는 모두 반영해요`
  return `참석하는 ${group.attendingCount}명이 함께할 수 있어요`
}

// 참석 집계(비교용, 사람 단위 — SPEC §4.3의 분모 고정 원칙: 분모는 항상 전체 초대 인원).
export function formatAttendCount(group: CandidateGroup): string {
  return `참석 ${group.attendingCount}/${group.totalInvited}`
}

function avoidChipCountForSlot(person: Person, slot: Slot): number {
  return person.response.chips.filter((chip) => {
    if (chip.type !== '회피') return false
    const days = chip.day === '*' ? ALL_DAYS : [chip.day]
    return days.includes(slot.day) && chip.hours.includes(slot.hour)
  }).length
}

// "고려할 점" 블록의 포기 내용(12C-12) — 내부 용어("포기", "미반영") 대신 사용자 언어로 말하되,
// 주체와 건수는 명시한다(R2/R4 악용 대응·R1 집계 단위 원칙). 제외자는 참석 구분(필수/선택)을
// 함께 말한다 — R1상 제외될 수 있는 건 선택 참석자뿐이지만, 라벨은 실제 필드에서 파생한다.
export function formatConsiderations(group: CandidateGroup, people: Person[]): string[] {
  const items: string[] = []

  for (const id of group.prefUnmet) {
    const person = people.find((p) => p.id === id)
    const count = person ? Math.max(1, avoidChipCountForSlot(person, group.defaultSlot)) : 1
    items.push(`${personName(id, people)} 님이 피하고 싶은 시간 ${count}건과 겹쳐요.`)
  }

  if (group.excluded.length > 0) {
    const labels = new Set(
      group.excluded.map((id) => people.find((p) => p.id === id)).map((p) => (p ? attendanceLabel(p.attendance) : '')),
    )
    const labelText = labels.size === 1 ? `${[...labels][0]} 참석자인 ` : ''
    const names = group.excluded.map((id) => `${personName(id, people)} 님`).join('과 ')
    items.push(`${labelText}${names}은 참석하지 않아요.`)
  }

  return items
}
