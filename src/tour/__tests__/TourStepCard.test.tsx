import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TourStepCard } from '../TourStepCard'

function render(extra: Partial<Parameters<typeof TourStepCard>[0]> = {}): string {
  return renderToStaticMarkup(
    <TourStepCard
      title="테스트 제목"
      body="테스트 본문"
      stepNumber={1}
      totalSteps={4}
      onSkip={() => {}}
      {...extra}
    />,
  )
}

// 접힘/펼침 토글과 "단계 전환 시 재펼침"은 클릭·재렌더가 필요해 SSR 단일 렌더로 재현할 수 없다
// (프로젝트 공통 한계 — 코드 검토로 확인: setCollapsed 토글, lastTitle 렌더 단계 동기화).
// 여기서는 고정 위치·헤더 구성·기본 펼침 상태의 구조만 검증한다.
describe('TourStepCard — 우측 하단 스택 고정 + 접기(12C-10)', () => {
  it('카드는 우측 하단 스택 클래스(bottom-16 right-4 — 다시 보기 pill 위, 체험하기 pill과 같은 자리)를 쓰고, 자동 이동을 위한 style 좌표가 없다', () => {
    const html = render()
    expect(html).toContain('bottom-16')
    expect(html).toContain('right-4')
    expect(html).not.toContain('left-8')
    // 이전 구현은 계산된 top/left를 인라인 style로 주입했다 — 이동 로직 제거의 구조적 증거.
    expect(html).not.toContain('style=')
  })

  it('헤더에 단계 표시·건너뛰기·접기 토글이 함께 있다(접힌 상태에서도 접근 가능한 구성)', () => {
    const html = render()
    expect(html).toContain('1 / 4단계')
    expect(html).toContain('투어 건너뛰기')
    expect(html).toContain('>접기<')
  })

  it('접기 토글은 aria-expanded와 aria-controls로 본문에 연결된다(기본은 펼침)', () => {
    const html = render()
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-controls="tour-step-body"')
    expect(html).toContain('id="tour-step-body"')
    expect(html).toContain('테스트 본문')
  })

  it('CTA(primaryAction)는 본문 영역 안에 있다 — 접으면 함께 숨는 구조', () => {
    const html = render({ primaryAction: { label: '체험 시작하기', onClick: () => {} } })
    const bodyStart = html.indexOf('id="tour-step-body"')
    const ctaIndex = html.indexOf('체험 시작하기')
    expect(bodyStart).toBeGreaterThan(-1)
    expect(ctaIndex).toBeGreaterThan(bodyStart)
  })
})

describe('TourStepCard — 4단계 공통 가이드 시스템(카드 골격·CTA 통일)', () => {
  it('카드 골격은 토큰 참조다: 폭(--container-tour-card)·패딩(card-pad-sm)·라운드(card)·그림자(elevated)', () => {
    const html = render()
    expect(html).toContain('w-[var(--container-tour-card)]')
    expect(html).toContain('p-card-pad-sm')
    expect(html).toContain('rounded-card')
    expect(html).toContain('shadow-elevated')
    // 이전 하드코딩 값이 남아 있지 않다.
    expect(html).not.toContain('w-80')
  })

  it('CTA는 어떤 단계든 공용 Button(primary·sm) 스타일 하나다 — 높이·라운드·색·폰트 통일', () => {
    const experience = render({ primaryAction: { label: '체험 시작하기', onClick: () => {} } })
    const fill = render({ primaryAction: { label: '예시 문장 채우기', onClick: () => {} } })
    for (const html of [experience, fill]) {
      expect(html).toContain('h-control-sm')
      expect(html).toContain('rounded-button')
      expect(html).toContain('bg-action-primary')
      expect(html).toContain('font-semibold')
    }
  })

  it('보조 콘텐츠(auxiliaryContent)는 본문 영역 슬롯으로 렌더된다', () => {
    const html = render({ auxiliaryContent: <p>예시 문장 박스</p> })
    const bodyStart = html.indexOf('id="tour-step-body"')
    expect(html.indexOf('예시 문장 박스')).toBeGreaterThan(bodyStart)
  })

  it('primaryAction이 없는 단계는 행동 영역을 렌더하지 않는다 — 버튼은 헤더의 2개(건너뛰기·접기)뿐', () => {
    const html = render()
    expect((html.match(/<button/g) ?? []).length).toBe(2)
  })
})
