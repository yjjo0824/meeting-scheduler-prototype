import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TourHighlightRing, holeRadius } from '../TourHighlightRing'

const RECT = { top: 100, left: 200, width: 300, height: 44, radius: 14 }

describe('TourHighlightRing — 하이라이트 구멍 라운드 보정(12C-11)', () => {
  it('holeRadius: 구멍의 radius = 대상 radius + 확장 여백(6px) — 안팎 곡선이 평행하게 유지된다', () => {
    expect(holeRadius(14)).toBe(20)
    expect(holeRadius(0)).toBe(6)
    // pill(9999px) 대상도 그대로 가산 — 과대한 값은 브라우저가 박스 절반으로 자동 클램프한다.
    expect(holeRadius(9999)).toBe(10005)
  })

  it('구멍의 border-radius는 하드코딩 클래스가 아니라 대상의 측정 radius에서 계산된다', () => {
    const html = renderToStaticMarkup(<TourHighlightRing rect={RECT} dim ring />)
    expect(html).toContain('border-radius:20px')
    // 이전 구현의 고정 라운드 클래스(rounded-lg)는 더 이상 없다.
    expect(html).not.toContain('rounded-lg')
  })

  it('구멍은 대상 rect보다 사방 6px 확장된 위치·크기를 쓴다(radius 가산과 같은 여백)', () => {
    const html = renderToStaticMarkup(<TourHighlightRing rect={RECT} dim ring />)
    expect(html).toContain('top:94px')
    expect(html).toContain('left:194px')
    expect(html).toContain('width:312px')
    expect(html).toContain('height:56px')
  })

  it('딤·링이 모두 꺼져 있으면 아무것도 그리지 않는다(단계 설정 구조 유지)', () => {
    expect(renderToStaticMarkup(<TourHighlightRing rect={RECT} dim={false} ring={false} />)).toBe('')
  })
})
