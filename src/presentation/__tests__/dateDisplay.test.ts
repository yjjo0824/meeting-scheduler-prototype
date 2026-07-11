import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { dateForDay, formatDisplayDate } from '../dateDisplay'

describe('verify_seed.py 패리티 — 날짜 표시 레이어(표시 전용)', () => {
  it('window 시작일은 월요일이어야 한다', () => {
    const start = new Date(`${RAW_SEED.schedule_display.window_start_date}T00:00:00`)
    expect(start.getDay()).toBe(1)
  })

  it('응답 데드라인은 window 시작보다 이전이어야 한다', () => {
    const deadline = new Date(`${RAW_SEED.schedule_display.response_deadline_date}T00:00:00`)
    const start = new Date(`${RAW_SEED.schedule_display.window_start_date}T00:00:00`)
    expect(deadline.getTime()).toBeLessThan(start.getTime())
  })

  it('금요일 13시가 SPEC 예시 문구("7월 17일(금) 오후 1:00–2:00")와 정확히 일치한다', () => {
    expect(formatDisplayDate('금', 13, RAW_SEED.schedule_display)).toBe('7월 17일(금) 오후 1:00–2:00')
  })

  it('요일 오프셋이 월요일부터 순서대로 파생된다(하드코딩 아님)', () => {
    const monday = dateForDay('월', RAW_SEED.schedule_display)
    const friday = dateForDay('금', RAW_SEED.schedule_display)
    const diffDays = (friday.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBe(4)
  })
})

describe('회귀 가드 — 날짜 표시 레이어가 엔진 계산에 스며들지 않는다', () => {
  it('src/engine/ 아래 어떤 파일도 presentation/을 import하지 않는다', () => {
    const engineDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'engine')
    const files = readdirSync(engineDir, { recursive: true }) as string[]
    const sourceFiles = files.filter((f) => f.endsWith('.ts') && !f.includes('__tests__'))

    expect(sourceFiles.length).toBeGreaterThan(0)
    for (const file of sourceFiles) {
      const content = readFileSync(join(engineDir, file), 'utf-8')
      expect(content).not.toMatch(/from ['"].*presentation/)
    }
  })
})
