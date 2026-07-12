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
describe('TourStepCard — 좌측 하단 완전 고정 + 접기(12C-6)', () => {
  it('카드는 좌측 하단 고정 클래스(bottom-8 left-8)를 쓰고, 자동 이동을 위한 style 좌표가 없다', () => {
    const html = render()
    expect(html).toContain('bottom-8')
    expect(html).toContain('left-8')
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

  it('CTA(ctaLabel)는 본문 영역 안에 있다 — 접으면 함께 숨는 구조', () => {
    const html = render({ ctaLabel: '체험 시작하기', onCta: () => {} })
    const bodyStart = html.indexOf('id="tour-step-body"')
    const ctaIndex = html.indexOf('체험 시작하기')
    expect(bodyStart).toBeGreaterThan(-1)
    expect(ctaIndex).toBeGreaterThan(bodyStart)
  })
})
