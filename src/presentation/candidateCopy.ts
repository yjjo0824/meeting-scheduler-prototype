import type { Day, Person } from '../types/domain'
import type { CandidateGroup, Slot } from '../types/engine'
import { attendanceLabel } from './conditionCopy'

const ALL_DAYS: Day[] = ['월', '화', '수', '목', '금']

function personName(id: string, people: Person[]): string {
  return people.find((p) => p.id === id)?.name ?? id
}

// 1층(비교용 집계, 사람 단위, 분모 고정) — cost 숫자는 여기서도 절대 읽지 않는다.
export function formatAttendCount(group: CandidateGroup): string {
  return `참석 ${group.attendingCount}/${group.totalInvited}`
}

// R1: 제외되는 사람은 항상 선택 참석자다(엔진 불변식) — "도윤·수아 님(선택) 제외"처럼 라벨을 공유한다.
export function formatExcludedClause(group: CandidateGroup, people: Person[]): string {
  if (group.excluded.length === 0) return ''
  const names = group.excluded.map((id) => personName(id, people)).join('·')
  const first = people.find((p) => p.id === group.excluded[0])
  const label = first ? attendanceLabel(first.attendance) : '선택'
  return `${names} 님(${label}) 제외`
}

export function formatTierOne(group: CandidateGroup, people: Person[]): string {
  const excludedClause = formatExcludedClause(group, people)
  return excludedClause ? `${formatAttendCount(group)} · ${excludedClause}` : formatAttendCount(group)
}

function chipCountForSlot(person: Person, slot: Slot): number {
  return person.response.chips.filter((chip) => {
    if (chip.type !== '회피') return false
    const days = chip.day === '*' ? ALL_DAYS : [chip.day]
    return days.includes(slot.day) && chip.hours.includes(slot.hour)
  }).length
}

// 2층(구체 포기, 주체 명시) — 조건 건수(칩 단위)는 이 층에서만 쓴다(R1 집계 단위 원칙).
export function formatSacrifice(group: CandidateGroup, people: Person[]): string {
  const clauses: string[] = []

  if (group.excluded.length > 0) {
    const names = group.excluded.map((id) => `${personName(id, people)} 님`).join('·')
    clauses.push(`선택 참석자 ${names} 제외`)
  }

  if (group.prefUnmet.length > 0) {
    const clause = group.prefUnmet
      .map((id) => {
        const person = people.find((p) => p.id === id)
        const count = person ? chipCountForSlot(person, group.defaultSlot) : 1
        return `${personName(id, people)} 님 선호 ${count}건 미반영`
      })
      .join(', ')
    clauses.push(clause)
  }

  return clauses.length > 0 ? clauses.join(' · ') : '포기 항목 없음'
}
