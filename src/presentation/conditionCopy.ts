import type { ChipDay, Day, Person } from '../types/domain'

export interface ConditionSummaryItem {
  key: string
  personId: string
  personName: string
  day: ChipDay
  hours: number[]
  typeLabel: string
  source: '캘린더' | '응답'
  // 참여자 본인 화면(R4: 본인=전부)에서만 렌더링에 쓴다 — 주최자 화면(PersonDetailPanel)은
  // 이 필드를 절대 읽지 않는다(사유·원문 비노출).
  cue?: string
}

// 연속된 시간을 "15~16시"처럼 범위로 묶는다. 격자에 12시가 없어 11과 13은 인접으로 보지 않는다
// (정수 +1 인접 여부만 본다 — 격자의 실제 시간 배열과 자연히 맞아떨어진다).
export function formatHourRange(hours: number[]): string {
  const sorted = [...hours].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]
    if (cur === prev + 1) {
      prev = cur
      continue
    }
    ranges.push(start === prev ? `${start}시` : `${start}~${prev}시`)
    start = cur
    prev = cur
  }
  ranges.push(start === prev ? `${start}시` : `${start}~${prev}시`)
  return ranges.join(', ')
}

// 주최자 화면(HostDashboard)에서만 쓰는 사용자 친화 라벨 — 참여자 화면(ParticipantPhoneFrame)의
// ChipItem은 이 함수를 쓰지 않고 chip.type을 직접 렌더링하므로 영향받지 않는다.
export function chipTypeLabel(type: '불가' | '회피' | '조정가능' | '병합' | '미분류'): string {
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
// day/hours를 원시 형태로 들고 있어(사전 포맷 문자열이 아님), 요일별 그룹화·범위 표기를 표시 레이어에서 자유롭게 한다.
export function buildConditionSummary(people: Person[]): ConditionSummaryItem[] {
  const items: ConditionSummaryItem[] = []

  for (const person of people) {
    for (const event of person.calendar) {
      items.push({
        key: `${person.id}-cal-${event.day}-${event.hours.join('_')}`,
        personId: person.id,
        personName: person.name,
        day: event.day,
        hours: event.hours,
        typeLabel: chipTypeLabel('불가'),
        source: '캘린더',
      })
    }

    for (const chip of person.response.chips) {
      if (chip.type === '병합') continue
      items.push({
        key: `${person.id}-chip-${chip.type}-${chip.day}-${chip.hours.join('_')}`,
        personId: person.id,
        personName: person.name,
        day: chip.day,
        hours: chip.hours,
        typeLabel: chipTypeLabel(chip.type),
        source: '응답',
        cue: chip.cue,
      })
    }
  }

  return items
}

export interface DayConditionGroup {
  day: string
  items: ConditionSummaryItem[]
}

const DAY_GROUP_ORDER = ['월', '화', '수', '목', '금', '매일']

// 같은 요일의 조건을 하나의 섹션으로 묶는다 — "*"(매일)는 별도 그룹으로 둔다.
export function groupConditionsByDay(items: ConditionSummaryItem[]): DayConditionGroup[] {
  const map = new Map<string, ConditionSummaryItem[]>()
  for (const item of items) {
    const key = item.day === '*' ? '매일' : (item.day as Day)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return DAY_GROUP_ORDER.filter((day) => map.has(day)).map((day) => ({ day, items: map.get(day)! }))
}
