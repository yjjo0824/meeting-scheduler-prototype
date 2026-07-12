import { describe, expect, it } from 'vitest'
import { chooseCardPosition } from '../TourStepCard'

const VIEWPORT = { width: 1280, height: 800 }
const CARD = { width: 320, height: 160 }

describe('chooseCardPosition — 좌측 하단 고정, 대상을 가릴 때만 상하 반전(12C-5, 순수 함수)', () => {
  it('대상이 없으면 기본값(좌측 하단)을 쓴다', () => {
    const pos = chooseCardPosition(CARD, null, VIEWPORT)
    expect(pos).toEqual({ top: VIEWPORT.height - 32 - CARD.height, left: 32 })
  })

  it('대상이 화면 오른쪽 위에 있으면(좌측 하단과 안 겹침) 좌측 하단을 그대로 쓴다', () => {
    const target = { top: 100, left: 800, width: 200, height: 80 }
    const pos = chooseCardPosition(CARD, target, VIEWPORT)
    expect(pos).toEqual({ top: VIEWPORT.height - 32 - CARD.height, left: 32 })
  })

  it('대상이 좌측 하단 카드 자리를 가리면 좌측 상단으로 상하 반전한다(좌우 이동 없음)', () => {
    // 좌측 하단 카드 영역과 겹치도록 화면 아래쪽 왼쪽에 큰 대상을 둔다.
    const target = { top: 500, left: 0, width: 500, height: 300 }
    const pos = chooseCardPosition(CARD, target, VIEWPORT)
    expect(pos).toEqual({ top: 32, left: 32 })
  })

  it('화면 전체를 덮는 대상이라도 좌측 상단으로만 반전한다(좌우 이동 금지 — x는 항상 margin)', () => {
    const target = { top: 0, left: 0, width: VIEWPORT.width, height: VIEWPORT.height }
    const pos = chooseCardPosition(CARD, target, VIEWPORT)
    expect(pos).toEqual({ top: 32, left: 32 })
    expect(pos.left).toBe(32)
  })

  it('margin·gap을 넘기면 그 값을 그대로 반영한다', () => {
    const pos = chooseCardPosition(CARD, null, VIEWPORT, 16, 4)
    expect(pos).toEqual({ top: VIEWPORT.height - 16 - CARD.height, left: 16 })
  })
})
