import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { MobileDayTabs } from '../MobileDayTabs'

describe('MobileDayTabs — 요일 단일 선택 탭(seed.grid.days로부터 파생)', () => {
  it('grid.days 전체가 탭으로 표시된다(하드코딩 아님)', () => {
    const html = renderToStaticMarkup(
      <MobileDayTabs days={RAW_SEED.grid.days} selectedDay={RAW_SEED.grid.days[0]} onSelectDay={() => {}} />,
    )
    for (const day of RAW_SEED.grid.days) expect(html).toContain(`>${day}<`)
    expect((html.match(/role="tab"/g) ?? []).length).toBe(RAW_SEED.grid.days.length)
  })

  it('현재 선택된 요일만 aria-selected="true"다(단일 선택)', () => {
    const selected = RAW_SEED.grid.days[2]
    const html = renderToStaticMarkup(
      <MobileDayTabs days={RAW_SEED.grid.days} selectedDay={selected} onSelectDay={() => {}} />,
    )
    expect((html.match(/aria-selected="true"/g) ?? []).length).toBe(1)
    const selectedIndex = html.indexOf('aria-selected="true"')
    const tagEnd = html.indexOf('>', selectedIndex)
    expect(html.slice(selectedIndex, tagEnd)).toBeTruthy()
    // 선택된 탭 버튼 안에 정확히 그 요일 글자가 있는지 확인
    const buttonEnd = html.indexOf('</button>', selectedIndex)
    expect(html.slice(selectedIndex, buttonEnd)).toContain(`>${selected}`)
  })
})
