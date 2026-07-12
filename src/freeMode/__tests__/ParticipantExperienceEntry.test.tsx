import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../data/loadSeed'
import { ParticipantExperienceEntry } from '../ParticipantExperienceEntry'

describe('ParticipantExperienceEntry — 주최자 제외(12C-5)', () => {
  const html = renderToStaticMarkup(<ParticipantExperienceEntry people={RAW_SEED.people} onSelect={() => {}} />)

  it('주최자(is_organizer — 지원)는 참여자 체험 목록에 없다: 응답 플로우가 없는 사람이다', () => {
    const organizer = RAW_SEED.people.find((p) => p.is_organizer)!
    expect(html).not.toContain(organizer.name)
  })

  it('나머지 5명은 전부 체험 진입 버튼으로 노출된다', () => {
    const others = RAW_SEED.people.filter((p) => !p.is_organizer)
    expect(others).toHaveLength(5)
    for (const person of others) {
      expect(html).toContain(person.name)
    }
  })
})
