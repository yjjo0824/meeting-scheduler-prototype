import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { ConditionMap } from '../ConditionMap'

function render(selectedPersonId: string | null = null, hasResponded?: Record<string, boolean>) {
  const responded =
    hasResponded ??
    RAW_SEED.people.reduce<Record<string, boolean>>((acc, p) => {
      acc[p.id] = p.responded_at_demo_start !== false
      return acc
    }, {})

  return renderToStaticMarkup(
    <ConditionMap
      people={RAW_SEED.people}
      hasResponded={responded}
      selectedPersonId={selectedPersonId}
      onSelectPerson={() => {}}
    />,
  )
}

describe('ConditionMap — 조건 지도(R4/R7 준수)', () => {
  it('6명 전원의 이름·직무·필수선택 라벨이 표시된다', () => {
    const html = render()
    for (const p of RAW_SEED.people) {
      expect(html).toContain(p.name)
      expect(html).toContain(p.job)
    }
    expect(html).toContain('필수')
    expect(html).toContain('선택')
  })

  it('미응답자(도윤)에게만 "답변 전" 배지가 붙는다', () => {
    const html = render()
    const doyunRowStart = html.indexOf('도윤')
    const minjunRowStart = html.indexOf('민준')
    const doyunRowEnd = html.indexOf('</tr>', doyunRowStart)
    const minjunRowEnd = html.indexOf('</tr>', minjunRowStart)
    expect(html.slice(doyunRowStart, doyunRowEnd)).toContain('답변 전')
    expect(html.slice(minjunRowStart, minjunRowEnd)).not.toContain('답변 전')
  })

  it('요일·시간 헤더가 seed.grid로부터 파생된다(하드코딩 아님)', () => {
    const html = render()
    for (const day of RAW_SEED.grid.days) expect(html).toContain(`${day}요일`)
    for (const hour of RAW_SEED.grid.hours) expect(html).toContain(`>${hour}<`)
  })

  it('범례가 참석 어려움/가급적 피함/옮길 수 있음/참석 가능 4종을 보여준다', () => {
    const html = render()
    expect(html).toContain('참석 어려움')
    expect(html).toContain('가급적 피함')
    expect(html).toContain('옮길 수 있음')
    expect(html).toContain('참석 가능')
  })

  it('선택된 참여자의 행에 강조 배경이 적용된다', () => {
    const html = render('haneul')
    expect(html).toContain('bg-brand-50')
  })

  it('도윤의 응답 칩(회피/불가)에서 나온 사유·원문은 어디에도 없다(R4)', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const html = render()
    expect(html).not.toContain(doyun.response.raw!)
    for (const chip of doyun.response.chips) {
      if (chip.cue) expect(html).not.toContain(chip.cue)
    }
  })

  it('응답 전인 도윤은 캘린더(월17)만 반영되고 응답 칩(수요일 불가 등)은 지도에 반영되지 않는다(R7)', () => {
    const html = render()
    // 도윤 행 구간만 잘라서 확인 — 다른 사람 셀의 title과 섞이지 않도록.
    const doyunIndex = html.indexOf('도윤')
    const nextIndex = html.indexOf('수아')
    const doyunSection = html.slice(doyunIndex, nextIndex)
    expect(doyunSection).not.toContain('수요일 14시 · 참석 어려움')
  })
})
