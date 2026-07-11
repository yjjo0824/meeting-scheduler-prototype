import type { Chip, ChipType, Day, Grid } from '../types/domain'
import type { ParseChipsInput } from './chipParser.types'

const DAY_GLYPH: Record<string, Day> = { 월: '월', 화: '화', 수: '수', 목: '목', 금: '금' }

// 접속사는 이 목록만 지원한다(범용 자연어 처리로 확장하지 않음, §6). "이랑"을 "랑"보다 먼저 두어
// 부분 매칭(예: "이랑"의 "랑"만 걸리는 경우)을 방지한다.
const CLAUSE_CONNECTIVES = /이랑|랑|와|과|그리고/

function splitClauses(raw: string): string[] {
  return raw
    .split(/[.]/)
    .flatMap((sentence) => sentence.split(/[,]/))
    .flatMap((segment) => segment.split(CLAUSE_CONNECTIVES))
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
}

function extractDay(clause: string): Day | null {
  const m = clause.match(/([월화수목금])요일/)
  return m ? DAY_GLYPH[m[1]] : null
}

// 시간 표현 어휘 — 특정 문장을 겨냥한 것이 아니라, 이 도메인(근무시간 격자 + 점심 제외)에서
// 반복되는 일반적인 한국어 시간 표현을 규칙화한 것이다.
function extractHours(clause: string, grid: Grid): number[] {
  if (/점심\s*(바로\s*)?(직후|다음|이후)/.test(clause)) {
    return grid.hours.includes(13) ? [13] : []
  }

  const explicit = clause.match(/(\d{1,2})\s*시/)
  if (explicit) {
    const n = Number(explicit[1])
    const hasAm = /오전/.test(clause)
    const hasPm = /오후/.test(clause)
    if (hasAm && grid.hours.includes(n)) return [n]
    if (hasPm && grid.hours.includes(n + 12)) return [n + 12]
    if (!hasAm && !hasPm) {
      if (n < 12 && grid.hours.includes(n + 12)) return [n + 12]
      if (grid.hours.includes(n)) return [n]
    }
  }

  if (/오후\s*내내|하루\s*종일\s*오후/.test(clause)) {
    return grid.hours.filter((h) => h >= 14)
  }
  if (/종일|하루\s*종일/.test(clause)) {
    return [...grid.hours]
  }
  if (/오전/.test(clause)) {
    return grid.hours.filter((h) => h < 12)
  }
  if (/오후/.test(clause)) {
    return grid.hours.filter((h) => h >= 14)
  }
  if (/저녁|늦은\s*시간/.test(clause)) {
    const last = grid.hours[grid.hours.length - 1]
    return last === undefined ? [] : [last]
  }

  return []
}

// R3: 확실성은 화자의 표현으로 판별한다 — "안 돼요"=불가, "피하고 싶어요"=회피, "옮길 수 있어요"=조정가능.
function explicitType(clause: string): ChipType | null {
  if (/웬만하면|피하고\s*싶|피하면\s*좋겠/.test(clause)) return '회피'
  if (/옮길\s*수\s*있|움직일\s*수\s*있/.test(clause)) return '조정가능'
  if (/안\s*돼요|안\s*됩니다|불가능|어려워요/.test(clause)) return '불가'
  return null
}

function extractCue(clause: string, type: ChipType): string {
  if (type === '회피') return clause.match(/웬만하면|피하고\s*싶[가-힣]*|피하면\s*좋겠[가-힣]*/)?.[0] ?? clause
  if (type === '조정가능') return clause.match(/옮길\s*수\s*있[가-힣]*|움직일\s*수\s*있[가-힣]*/)?.[0] ?? clause
  if (type === '불가') {
    const marker = clause.match(/안\s*돼요|안\s*됩니다|불가능|어려워요/)?.[0]
    if (marker) return marker
  }
  const activity = clause.match(/((?:[가-힣]+\s+)?[가-힣]{2,6})(?:이|가)\s*있/)
  if (activity) return activity[1]
  const going = clause.match(/([가-힣]{2,6})\s*(?:가야|하러|때문)/)
  if (going) return going[1]
  const connective = clause.match(/([가-힣]{2,6})(?:이|가)(?:고|라서|어서)/)
  if (connective) return connective[1]
  return clause.trim()
}

// R3: 캘린더 일정 = 기본 불가. 원문이 묘사하는 일정이 이미 캘린더에 있으면 병합, 없으면 새 불가로 판별한다.
function isSubsetOfCalendar(day: Day, hours: number[], calendarKeys: Set<string>): boolean {
  return hours.every((h) => calendarKeys.has(`${day}#${h}`))
}

export function parseChips({ raw, calendarEvents, grid }: ParseChipsInput): Chip[] {
  const calendarKeys = new Set<string>()
  for (const event of calendarEvents) {
    for (const hour of event.hours) calendarKeys.add(`${event.day}#${hour}`)
  }

  const chips: Chip[] = []

  for (const clause of splitClauses(raw)) {
    const day = extractDay(clause)
    const hours = extractHours(clause, grid)

    if (!day || hours.length === 0) {
      chips.push({ type: '미분류', day: day ?? '*', hours: [], cue: clause })
      continue
    }

    const marker = explicitType(clause)
    if (marker) {
      chips.push({ type: marker, day, hours, cue: extractCue(clause, marker) })
      continue
    }

    const type: ChipType = isSubsetOfCalendar(day, hours, calendarKeys) ? '병합' : '불가'
    chips.push({ type, day, hours, cue: extractCue(clause, type) })
  }

  return chips
}
