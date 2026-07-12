import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { buildConditionSets } from '../../../engine/conditionSets'
import { deriveEffectivePeople } from '../../../state/useSchedule'
import { MobileDayCompareGrid } from '../MobileDayCompareGrid'

function buildSets(hasResponded?: Record<string, boolean>) {
  const responded =
    hasResponded ??
    RAW_SEED.people.reduce<Record<string, boolean>>((acc, p) => {
      acc[p.id] = p.responded_at_demo_start !== false
      return acc
    }, {})
  const effective = deriveEffectivePeople(RAW_SEED.people, responded)
  return { sets: buildConditionSets(effective, RAW_SEED.grid), responded }
}

describe('MobileDayCompareGrid — 하루치 6명×8슬롯 비교(요일별 미니 지도 여러 개 대신 하나만)', () => {
  it('선택한 하루만 표 1개로 6명×(grid.hours 개수) 셀을 보여준다', () => {
    const { sets, responded } = buildSets()
    const day = RAW_SEED.grid.days[0]
    const html = renderToStaticMarkup(
      <MobileDayCompareGrid
        day={day}
        hours={RAW_SEED.grid.hours}
        people={RAW_SEED.people}
        hasResponded={responded}
        sets={sets}
        onSelectPerson={() => {}}
      />,
    )
    expect((html.match(/<table/g) ?? []).length).toBe(1)
    // ConditionMap의 SlotCell을 그대로 재사용하므로 aspect-square 셀 개수 = 6명 × hours.length
    const cellMatches = html.match(/aspect-square [^"]*"/g) ?? []
    expect(cellMatches.length).toBe(RAW_SEED.people.length * RAW_SEED.grid.hours.length)
    for (const match of cellMatches) expect(match).toContain('min-w-[12px]')
  })

  it('시간 헤더가 grid.hours 그대로, 다른 요일 슬롯은 섞이지 않는다', () => {
    const { sets, responded } = buildSets()
    const day = RAW_SEED.grid.days[1]
    const html = renderToStaticMarkup(
      <MobileDayCompareGrid
        day={day}
        hours={RAW_SEED.grid.hours}
        people={RAW_SEED.people}
        hasResponded={responded}
        sets={sets}
        onSelectPerson={() => {}}
      />,
    )
    for (const hour of RAW_SEED.grid.hours) expect(html).toContain(`>${hour}<`)
    // title에 선택한 요일만 등장하고 다른 요일은 등장하지 않는다.
    expect(html).toContain(`${day}요일`)
    const otherDay = RAW_SEED.grid.days.find((d) => d !== day)!
    expect(html).not.toContain(`${otherDay}요일`)
  })

  it('참여자 이름 셀에 whitespace-nowrap이 적용되어 세로로 꺾이지 않는다', () => {
    const { sets, responded } = buildSets()
    const html = renderToStaticMarkup(
      <MobileDayCompareGrid
        day={RAW_SEED.grid.days[0]}
        hours={RAW_SEED.grid.hours}
        people={RAW_SEED.people}
        hasResponded={responded}
        sets={sets}
        onSelectPerson={() => {}}
      />,
    )
    const nameIndex = html.indexOf(RAW_SEED.people[0].name)
    const divStart = html.lastIndexOf('<div', nameIndex)
    const divTag = html.slice(divStart, html.indexOf('>', divStart))
    expect(divTag).toContain('whitespace-nowrap')
  })
})
