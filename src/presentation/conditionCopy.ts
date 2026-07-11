import type { Chip, Person } from '../types/domain'

export interface ConditionSummaryItem {
  key: string
  personId: string
  personName: string
  text: string
  source: '캘린더' | '응답'
}

function hoursLabel(hours: number[]): string {
  return hours.map((h) => `${h}시`).join(', ')
}

// 주최자 화면(HostDashboard)에서만 쓰는 사용자 친화 라벨 — 참여자 화면(ParticipantPhoneFrame)의
// ChipItem은 이 함수를 쓰지 않고 chip.type을 직접 렌더링하므로 영향받지 않는다.
function chipTypeLabel(type: Chip['type']): string {
  switch (type) {
    case '불가':
      return '참석 어려움'
    case '회피':
      return '가급적 피함'
    case '조정가능':
      return '옮길 수 있음'
    case '병합':
      return '캘린더에 있어요'
    case '미분류':
      return '미분류'
  }
}

export function attendanceLabel(attendance: Person['attendance']): string {
  return attendance === 'required' ? '필수' : '선택'
}

// R4 공개 범위: 주최자에게는 시간·성격(조건)만 전달한다 — 사유(cue)·원문(raw)·일정 제목은 절대 포함하지 않는다.
// 병합 칩은 캘린더와 동일한 정보이므로 별도 항목을 만들지 않는다(중복 노출 방지).
export function buildConditionSummary(people: Person[]): ConditionSummaryItem[] {
  const items: ConditionSummaryItem[] = []

  for (const person of people) {
    for (const event of person.calendar) {
      items.push({
        key: `${person.id}-cal-${event.day}-${event.hours.join('_')}`,
        personId: person.id,
        personName: person.name,
        text: `${event.day} ${hoursLabel(event.hours)} · ${chipTypeLabel('불가')}`,
        source: '캘린더',
      })
    }

    for (const chip of person.response.chips) {
      if (chip.type === '병합') continue
      const dayLabel = chip.day === '*' ? '매일' : chip.day
      items.push({
        key: `${person.id}-chip-${chip.type}-${dayLabel}-${chip.hours.join('_')}`,
        personId: person.id,
        personName: person.name,
        text: `${dayLabel} ${hoursLabel(chip.hours)} · ${chipTypeLabel(chip.type)}`,
        source: '응답',
      })
    }
  }

  return items
}
