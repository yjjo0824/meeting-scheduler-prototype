import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../../../data/loadSeed'
import { PersonDetailPanel } from '../PersonDetailPanel'

function person(id: string) {
  return RAW_SEED.people.find((p) => p.id === id)!
}

function render(personId: string, responded: boolean) {
  return renderToStaticMarkup(
    <PersonDetailPanel person={person(personId)} responded={responded} onChangeAttendance={() => {}} />,
  )
}

describe('PersonDetailPanel — 출처·조건·진입 CTA(IMPLEMENTATION_SPEC §4.2, R4)', () => {
  it('민준(응답 완료)의 조건이 출처 라벨과 함께 표시된다', () => {
    const html = render('minjun', true)
    expect(html).toContain('캘린더에서 확인')
    expect(html).toContain('답변으로 알려줌')
    expect(html).toContain('가급적 피함')
  })

  it('실제 제품 화면에는 참여자 화면 보기 CTA가 없다(항목 5: 체험 레이어와 분리)', () => {
    const html = render('minjun', true)
    expect(html).not.toContain('참여자 화면 보기')
  })

  it('사유·원문(cue/raw)은 어디에도 노출되지 않는다(R4)', () => {
    const doyun = person('doyun')
    const html = render('doyun', true)
    expect(html).not.toContain(doyun.response.raw!)
    for (const chip of doyun.response.chips) {
      if (chip.cue) expect(html).not.toContain(chip.cue)
    }
  })

  it('응답 전인 도윤은 캘린더 조건(월요일 17시·참석 어려움)만 보이고, 응답 칩(회피·조정가능)은 아직 보이지 않는다(R7)', () => {
    const html = render('doyun', false)
    // 캘린더 출처는 응답 여부와 무관하게 항상 알려진 정보라 그대로 보인다(요일별로 묶여 표시됨).
    expect(html).toContain('월요일')
    expect(html).toContain('17시')
    expect(html).toContain('캘린더에서 확인')
    // 응답 칩에서만 나올 수 있는 출처 라벨·문구는 아직 없어야 한다.
    expect(html).not.toContain('답변으로 알려줌')
    expect(html).not.toContain('가급적 피함')
  })

  it('주최자(지원)에게는 필수/선택 변경 버튼이 없다', () => {
    const html = render('jiwon', true)
    expect(html).not.toContain('참석 구분')
  })

  it('주최자가 아닌 참여자에게는 필수/선택 변경 버튼이 있다', () => {
    const html = render('doyun', true)
    expect(html).toContain('참석 구분')
  })

  it('프라이버시 안내 문구가 표시된다', () => {
    const html = render('minjun', true)
    expect(html).toContain('주최자에게는 시간 조건만 보여요')
  })
})
