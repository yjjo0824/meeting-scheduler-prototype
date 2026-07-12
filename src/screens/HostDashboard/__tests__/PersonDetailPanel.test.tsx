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

  it('응답 전인 도윤은 캘린더 조건(월요일 17시 → "5-6시")만 보이고, 응답 칩(회피·조정가능)은 아직 보이지 않는다(R7)', () => {
    const html = render('doyun', false)
    // 캘린더 출처는 응답 여부와 무관하게 항상 알려진 정보라 그대로 보인다(요일별 행 + 1시간 슬롯 표기).
    expect(html).toContain('월요일')
    expect(html).toContain('5-6시')
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

describe('PersonDetailPanel — 요일별 행·1시간 슬롯 표기(하늘, seed 파생)', () => {
  const html = render('haneul', true)

  it('캘린더 출처: 월요일 행에 11-12시·1-2시·2-3시가 각각 분리되어 보인다(11,13,14 — 합치지 않음)', () => {
    expect(html).toContain('아래 시간에는 참석이 어려워요')
    const monday = html.indexOf('월요일')
    const wednesday = html.indexOf('수요일')
    const mondayRow = html.slice(monday, wednesday)
    expect(mondayRow).toContain('11-12시')
    expect(mondayRow).toContain('1-2시')
    expect(mondayRow).toContain('2-3시')
    expect(html).not.toContain('1-3시')
    expect(html).not.toContain('13~14시')
  })

  it('캘린더 출처: 수요일 1-2시, 금요일 9-10시·2-3시가 요일 행으로 분리되어 보인다', () => {
    const wednesday = html.indexOf('수요일')
    const friday = html.indexOf('금요일')
    expect(html.slice(wednesday, friday)).toContain('1-2시')
    const fridayRow = html.slice(friday)
    expect(fridayRow).toContain('9-10시')
    expect(fridayRow).toContain('2-3시')
  })

  it('답변 출처: 금요일 2-3시 옆에 "옮길 수 있어요" 파란 배지가 보인다', () => {
    expect(html).toContain('답변으로 알려줌')
    expect(html).toContain('캘린더 일정 중 조정할 수 있는 시간이 있어요')
    const badgeIdx = html.indexOf('옮길 수 있어요')
    expect(badgeIdx).toBeGreaterThan(-1)
    expect(html.slice(badgeIdx - 400, badgeIdx)).toContain('2-3시')
    expect(html.slice(html.lastIndexOf('<span', badgeIdx), badgeIdx)).toContain('bg-brand-50')
  })

  it('"낮" 표현과 시간대 접두(오전/오후)가 이 패널에 없다', () => {
    expect(html).not.toContain('낮')
    expect(html).not.toContain('오전')
    expect(html).not.toContain('오후')
  })

  it('유지 요소: 이름·직무·필수 참석·답변 완료·프라이버시 안내', () => {
    expect(html).toContain('하늘 님의 시간 조건')
    expect(html).toContain('개발 리드')
    expect(html).toContain('필수 참석')
    expect(html).toContain('답변 완료')
    expect(html).toContain('주최자에게는 시간 조건만 보여요')
  })

  it('캘린더 출처에는 색상 배지가 없다 — 파란 배지는 답변 출처의 조정가능뿐', () => {
    expect((html.match(/옮길 수 있어요/g) ?? []).length).toBe(1)
  })
})

describe('PersonDetailPanel — 참석 어려움 신고 상태(12B QA 항목 1)', () => {
  it('reported=true면 신고 안내 한 줄이 보이고, 이유·원문은 없다(R4)', () => {
    const html = renderToStaticMarkup(
      <PersonDetailPanel person={person('seoyeon')} responded reported onChangeAttendance={() => {}} />,
    )
    expect(html).toContain('확정된 시간에 참석하기 어렵다고 알려왔어요')
    const seoyeon = person('seoyeon')
    if (seoyeon.response.raw) expect(html).not.toContain(seoyeon.response.raw)
  })

  it('reported가 없으면(기본값) 신고 안내가 보이지 않는다', () => {
    const html = render('seoyeon', true)
    expect(html).not.toContain('참석하기 어렵다고 알려왔어요')
  })
})
