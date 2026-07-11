import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { CalendarPrefillList } from '../CalendarPrefillList'
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
  return html.split('rounded-lg border border-slate-200 p-2.5 text-sm').slice(1)
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
