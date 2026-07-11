import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppProvider } from '../../../state/AppContext'
import { RAW_SEED } from '../../../data/loadSeed'
import { HostDashboard } from '../HostDashboard'

// react-dom/server만으로 정적 HTML을 렌더링해 필수 표시 문구를 검증한다.
// jsdom·RTL·브라우저 자동화 없이도 "필수 요소가 실제로 그려지는가"를 자동으로 확인할 수 있다.
function renderHostDashboard(): string {
  return renderToStaticMarkup(
    <AppProvider>
      <HostDashboard />
    </AppProvider>,
  )
}

describe('HostDashboard — IMPLEMENTATION_SPEC §4 필수 표시', () => {
  const html = renderHostDashboard()

  it('회의명이 표시된다', () => {
    expect(html).toContain(RAW_SEED.meeting.title)
  })

  it('범위·소요시간·응답 기한이 seed 데이터로부터 표시된다(하드코딩 아님)', () => {
    expect(html).toContain(RAW_SEED.meeting.window)
    expect(html).toContain(`${RAW_SEED.meeting.duration_hours}시간`)
    expect(html).toContain(RAW_SEED.meeting.response_deadline)
  })

  it('6명 중 5명 응답 완료가 표시된다(투어 시작 상태)', () => {
    expect(html).toContain('6명 중 5명 응답 완료')
  })

  it('도윤/마케터/선택/미응답이 표시된다', () => {
    expect(html).toContain('도윤')
    expect(html).toContain('마케터')
    expect(html).toContain('선택')
    expect(html).toContain('미응답')
  })

  it('잠정 추천 배너 문구가 정확히 일치한다', () => {
    expect(html).toContain('잠정 추천: 수요일 14시 · 확정 일정 기준 · 도윤 님 응답 전이에요')
  })

  it('리마인드 보내기 버튼이 표시된다', () => {
    expect(html).toContain('리마인드 보내기')
  })

  it('도윤의 응답 원문·사유(cue)는 어디에도 노출되지 않는다(R4)', () => {
    const doyun = RAW_SEED.people.find((p) => p.id === 'doyun')!
    expect(html).not.toContain(doyun.response.raw!)
    for (const chip of doyun.response.chips) {
      if (chip.cue) expect(html).not.toContain(chip.cue)
    }
  })

  it('응답 전인 도윤의 응답 칩(회피/불가) 조건은 아직 노출되지 않는다(R7)', () => {
    // 도윤은 캘린더(월17)만 알려진 상태 — 응답 칩에서 나온 "회피"/"금 17시" 문구는 아직 없어야 한다.
    expect(html).not.toContain('금 17시')
  })
})
