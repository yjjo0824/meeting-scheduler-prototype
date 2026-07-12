import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SlotPicker } from '../SlotPicker'
import type { Slot } from '../../../types/engine'

function slots(n: number): Slot[] {
  const hours = [9, 10, 11, 13, 14, 15, 16, 17]
  return hours.slice(0, n).map((h) => ({ day: '수' as const, hour: h }))
}

describe('SlotPicker — 노출 개수 규칙(R2)', () => {
  it('4개 슬롯(숨는 게 1개뿐)이면 전부 노출하고 "더 보기" 버튼이 없다 — 시드의 수14~17 케이스', () => {
    const html = renderToStaticMarkup(<SlotPicker slots={slots(4)} selectedSlot={slots(4)[0]} onSelectSlot={() => {}} />)
    expect(html).toContain('9시')
    expect(html).toContain('10시')
    expect(html).toContain('11시')
    expect(html).toContain('13시')
    expect(html).not.toContain('개 더 보기')
  })

  it('3개 이하면 전부 노출하고 "더 보기" 버튼이 없다', () => {
    const html = renderToStaticMarkup(<SlotPicker slots={slots(3)} selectedSlot={slots(3)[0]} onSelectSlot={() => {}} />)
    expect(html).not.toContain('개 더 보기')
  })

  it('5개면 3개만 노출하고 "2개 더 보기"가 보인다', () => {
    const html = renderToStaticMarkup(<SlotPicker slots={slots(5)} selectedSlot={slots(5)[0]} onSelectSlot={() => {}} />)
    expect(html).toContain('2개 더 보기')
    expect(html).not.toContain('14시')
  })
})

describe('SlotPicker — 시간 버튼의 선택 상태(12B-2: aria-pressed)', () => {
  it('선택된 슬롯 버튼만 aria-pressed=true, 나머지는 false다', () => {
    const all = slots(4)
    const html = renderToStaticMarkup(<SlotPicker slots={all} selectedSlot={all[1]} onSelectSlot={() => {}} />)
    const pressedTrue = html.match(/aria-pressed="true"/g) ?? []
    const pressedFalse = html.match(/aria-pressed="false"/g) ?? []
    expect(pressedTrue.length).toBe(1)
    expect(pressedFalse.length).toBe(3)
  })
})
