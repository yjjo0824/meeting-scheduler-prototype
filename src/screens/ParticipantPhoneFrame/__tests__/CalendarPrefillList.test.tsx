import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { CalendarPrefillList, appliedCorrectionKind, isEventPreMarkedMovable } from '../CalendarPrefillList'
import type { CalendarCorrection } from '../../../state/appState.types'

function haneul() {
  return RAW_SEED.people.find((p) => p.id === 'haneul')!
}

function render(corrections: Record<string, CalendarCorrection>) {
  return renderToStaticMarkup(
    <CalendarPrefillList person={haneul()} corrections={corrections} onApplyCorrection={() => {}} onUndoCorrection={() => {}} />,
  )
}

// haneul().calendar 순서: 월11(채용 인터뷰) · 월13-14(외부 미팅) · 수13(1:1) · 금9(스탠드업) · 금14(마감 리뷰)
function eventBlocks(html: string): string[] {
  return html.split('rounded-chip border border-border p-3 text-sm').slice(1)
}

describe('CalendarPrefillList — 항목 1: 이미 적용된 정정의 중복 실행 방지', () => {
  it('정정이 없는 일정은 헤더가 활성 상태이고 "탭해서 정정" 안내가 보인다', () => {
    const html = render({})
    const blocks = eventBlocks(html)
    expect(blocks).toHaveLength(5)
    for (const block of blocks) {
      expect(block).toContain('탭해서 정정')
      expect(block).not.toContain('disabled')
      expect(block).not.toContain('정정됨')
    }
  })

  it('금14(마감 리뷰)에 movable 정정이 이미 적용되면 헤더가 비활성화되고 "정정됨 · 옮길 수 있어요"로 표시된다', () => {
    const html = render({ '금#14': { kind: 'movable' } })
    const blocks = eventBlocks(html)
    const correctedBlock = blocks[4] // 마감 리뷰(금14)

    expect(correctedBlock).toContain('disabled')
    expect(correctedBlock).toContain('aria-disabled="true"')
    expect(correctedBlock).toContain('정정됨 · 옮길 수 있어요')
    expect(correctedBlock).toContain('실행 취소')
    // 같은 정정을 다시 실행할 수 있는 옵션 버튼은 더 이상 노출되지 않는다.
    expect(correctedBlock).not.toContain('>이 시간 비어 있어요<')
    expect(correctedBlock).not.toContain('>옮길 수 있어요<')
    expect(correctedBlock).not.toContain('탭해서 정정')
  })

  it('다른 일정(월11)은 여전히 정정 전 상태로 남아있다(하나를 정정해도 나머지에 영향 없음)', () => {
    const html = render({ '금#14': { kind: 'movable' } })
    const blocks = eventBlocks(html)
    const untouchedBlock = blocks[0] // 채용 인터뷰(월11)

    expect(untouchedBlock).toContain('탭해서 정정')
    expect(untouchedBlock).not.toContain('정정됨')
    expect(untouchedBlock).not.toContain('disabled')
  })

  it('수13(1:1)에 empty 정정이 적용되면 "정정됨 · 이 시간 비어 있어요"로, movable과 다르게 표시된다', () => {
    const html = render({ '수#13': { kind: 'empty' } })
    const blocks = eventBlocks(html)
    const correctedBlock = blocks[2] // 1:1(수13)

    expect(correctedBlock).toContain('disabled')
    expect(correctedBlock).toContain('정정됨 · 이 시간 비어 있어요')
    expect(correctedBlock).toContain('사내 캘린더에서 열기')
    expect(correctedBlock).not.toContain('옮길 수 있어요')
  })

  it("'옮길 수 있어요'와 '이 시간 비어 있어요'는 서로 다른 kind로 유지된다(동일 action으로 병합되지 않음)", () => {
    const html = render({ '금#14': { kind: 'movable' }, '수#13': { kind: 'empty' } })
    const blocks = eventBlocks(html)

    expect(blocks[2]).toContain('정정됨 · 이 시간 비어 있어요')
    expect(blocks[4]).toContain('정정됨 · 옮길 수 있어요')
  })
})

describe('CalendarPrefillList — 12B-1 추가 QA: 원본에 이미 조정가능(옮길 수 있어요)인 슬롯은 같은 버튼을 다시 켤 수 없다', () => {
  it('isEventPreMarkedMovable: 하늘의 금14(마감 리뷰)는 원본 응답의 조정가능 칩 때문에 true다', () => {
    const person = haneul()
    const event = person.calendar.find((e) => e.day === '금' && e.hours.includes(14))!
    expect(isEventPreMarkedMovable(event, person)).toBe(true)
  })

  it('isEventPreMarkedMovable: 하늘의 다른 캘린더 일정(월11 채용 인터뷰)은 조정가능 칩이 없어 false다', () => {
    const person = haneul()
    const event = person.calendar.find((e) => e.day === '월' && e.hours.includes(11))!
    expect(isEventPreMarkedMovable(event, person)).toBe(false)
  })

  it('appliedCorrectionKind: 정정이 없으면 undefined, 있으면 그 kind를 반환한다', () => {
    const event = haneul().calendar.find((e) => e.day === '금' && e.hours.includes(14))!
    expect(appliedCorrectionKind(event, {})).toBeUndefined()
    expect(appliedCorrectionKind(event, { '금#14': { kind: 'movable' } })).toBe('movable')
    expect(appliedCorrectionKind(event, { '금#14': { kind: 'empty' } })).toBe('empty')
  })

  it('금14가 아직 UI로 정정되지 않은 상태에서, 옵션을 열면 [옮길 수 있어요]만 비활성화되고 [이 시간 비어 있어요]는 선택 가능해야 한다(설계 검증)', () => {
    // CalendarPrefillList 컴포넌트 렌더 로직이 실제로 사용하는 것과 동일한 두 헬퍼로 버튼 disabled
    // 여부를 검증한다 — openEventKey는 로컬 state라 SSR로 클릭을 재현할 수 없으므로, 렌더가 사용할
    // 판단 로직 자체를 직접 확인한다(프로젝트의 기존 로컬 상태 검증 방식과 동일).
    const person = haneul()
    const event = person.calendar.find((e) => e.day === '금' && e.hours.includes(14))!
    const movableDisabled = isEventPreMarkedMovable(event, person)
    const corrected = appliedCorrectionKind(event, {}) !== undefined

    expect(corrected).toBe(false) // 아직 어떤 UI 정정도 적용되지 않았다
    expect(movableDisabled).toBe(true) // 그래도 [옮길 수 있어요]는 비활성화되어야 한다
    // [이 시간 비어 있어요]에는 이런 사전 차단 로직이 전혀 없다 — 항상 선택 가능하다.
  })
})
