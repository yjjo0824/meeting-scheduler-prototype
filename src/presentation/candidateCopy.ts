import type { Day, Person } from '../types/domain'
import type { CandidateGroup, Slot } from '../types/engine'

const ALL_DAYS: Day[] = ['월', '화', '수', '목', '금']

function personName(id: string, people: Person[]): string {
  return people.find((p) => p.id === id)?.name ?? id
}

// 참석 인원(비교용 집계, 사람 단위) — SPEC §4.3의 분모 고정 원칙: 분모는 항상 전체 초대 인원.
// cost 숫자는 여기서도 절대 읽지 않는다.
export function formatAttendSummary(group: CandidateGroup): string {
  if (group.excluded.length === 0) return `${group.totalInvited}명 모두 참석`
  return `${group.attendingCount} / ${group.totalInvited}명 참석`
}

function avoidChipCountForSlot(person: Person, slot: Slot): number {
  return person.response.chips.filter((chip) => {
    if (chip.type !== '회피') return false
    const days = chip.day === '*' ? ALL_DAYS : [chip.day]
    return days.includes(slot.day) && chip.hours.includes(slot.hour)
  }).length
}

// 반영하지 못한 조건(구체 포기, 주체 명시 — SPEC §4.3 2층) — 내부 용어("포기", "미반영") 대신
// 사용자 언어로 말하되, 주체와 건수(2건 이상일 때)는 유지한다(R4 악용 대응·R1 집계 단위 원칙).
export function formatUnmetConditions(group: CandidateGroup, people: Person[]): string {
  const sentences: string[] = []

  if (group.excluded.length > 0) {
    const names = group.excluded.map((id) => `${personName(id, people)} 님`).join('과 ')
    sentences.push(`${names}은 참석하지 않아요.`)
  }

  if (group.prefUnmet.length > 0) {
    for (const id of group.prefUnmet) {
      const person = people.find((p) => p.id === id)
      const count = person ? avoidChipCountForSlot(person, group.defaultSlot) : 1
      sentences.push(
        count > 1
          ? `${personName(id, people)} 님이 피하고 싶은 시간 ${count}건과 겹쳐요.`
          : `${personName(id, people)} 님이 피하고 싶은 시간이에요.`,
      )
    }
  } else if (group.excluded.length > 0) {
    sentences.push(`나머지 ${group.attendingCount}명의 원하는 시간은 모두 지켜요.`)
  }

  if (sentences.length === 0) return '모두의 조건을 지켜요.'
  return sentences.join(' ')
}