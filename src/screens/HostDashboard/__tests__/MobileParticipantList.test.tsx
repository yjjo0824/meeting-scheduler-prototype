import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { buildConditionSummary } from '../../../presentation/conditionCopy'
import { MobileParticipantList } from '../MobileParticipantList'

function render(hasResponded?: Record<string, boolean>) {
  const responded =
    hasResponded ??
    RAW_SEED.people.reduce<Record<string, boolean>>((acc, p) => {
      acc[p.id] = p.responded_at_demo_start !== false
      return acc
    }, {})

  return renderToStaticMarkup(
    <MobileParticipantList people={RAW_SEED.people} hasResponded={responded} onSelectPerson={() => {}} />,
  )
}

describe('MobileParticipantList — 모바일 첫 화면의 참여자 목록', () => {
  it('6명 전원의 이름·직무·필수/선택 라벨·조건 건수가 표시된다(하드코딩 아님, buildConditionSummary와 대조)', () => {
    const html = render()
    for (const person of RAW_SEED.people) {
      expect(html).toContain(person.name)
      expect(html).toContain(person.job)
      const expectedCount = buildConditionSummary([person]).length
      expect(html).toContain(`조건 ${expectedCount}건`)
    }
  })

  it('미응답자(도윤)에게만 "답변 전" 배지가 붙는다', () => {
    const html = render()
    const doyunStart = html.indexOf('도윤')
    const minjunStart = html.indexOf('민준')
    const doyunEnd = html.indexOf('</button>', doyunStart)
    const minjunEnd = html.indexOf('</button>', minjunStart)
    expect(html.slice(doyunStart, doyunEnd)).toContain('답변 전')
    expect(html.slice(minjunStart, minjunEnd)).not.toContain('답변 전')
  })

  it('도윤의 응답 원문·사유(cue)는 어디에도 노출되지 않는다(R4)', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    const html = render()
    expect(html).not.toContain(doyun.response.raw!)
    for (const chip of doyun.response.chips) {
      if (chip.cue) expect(html).not.toContain(chip.cue)
    }
  })

  it('행은 버튼이라 탭 가능하지만, 참여자 화면(폰 프레임) 진입을 암시하는 문구는 없다', () => {
    const html = render()
    expect(html).not.toContain('참여자 화면 보기')
    expect(html).not.toContain('체험')
  })
})
