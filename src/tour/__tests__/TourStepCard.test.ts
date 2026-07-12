import { describe, expect, it } from 'vitest'
import { chooseCardPosition } from '../TourStepCard'

const VIEWPORT = { width: 1280, height: 800 }
const CARD = { width: 320, height: 160 }

describe('chooseCardPosition — 우측하단 → 우측상단 → 좌측하단 충돌 회피(순수 함수)', () => {
  it('대상이 없으면 기본값(우측 하단)을 쓴다', () => {
    const pos = chooseCardPosition(CARD, null, VIEWPORT)
    expect(pos).toEqual({ top: VIEWPORT.height - 32 - CARD.height, left: VIEWPORT.width - 32 - CARD.width })
  })

  it('대상이 화면 왼쪽 위에 있으면(우측 하단과 안 겹침) 우측 하단을 그대로 쓴다', () => {
    const target = { top: 100, left: 100, width: 200, height: 80 }
    const pos = chooseCardPosition(CARD, target, VIEWPORT)
    expect(pos).toEqual({ top: VIEWPORT.height - 32 - CARD.height, left: VIEWPORT.width - 32 - CARD.width })
  })

  it('대상이 우측 하단과 겹치면 우측 상단으로 옮긴다', () => {
    // 우측 하단 카드 영역과 겹치도록 화면 아래쪽 오른쪽에 큰 대상을 둔다.
    const target = { top: 500, left: 700, width: 500, height: 250 }
    const pos = chooseCardPosition(CARD, target, VIEWPORT)
    expect(pos).toEqual({ top: 32, left: VIEWPORT.width - 32 - CARD.width })
  })

  it('대상이 우측 하단·우측 상단 모두와 겹치면 좌측 하단으로 옮긴다', () => {
    // 화면 오른쪽 전체 세로띠를 덮는 대상 — 우측 상단/하단 후보 둘 다 겹친다.
    const target = { top: 0, left: 700, width: 580, height: 800 }
    const pos = chooseCardPosition(CARD, target, VIEWPORT)
    expect(pos).toEqual({ top: VIEWPORT.height - 32 - CARD.height, left: 32 })
  })

  it('세 후보 모두와 겹치면 마지막 후보(좌측 하단)로 폴백한다', () => {
    // 화면 전체를 덮는 대상 — 어디에 둬도 겹친다.
    const target = { top: 0, left: 0, width: VIEWPORT.width, height: VIEWPORT.height }
    const pos = chooseCardPosition(CARD, target, VIEWPORT)
    expect(pos).toEqual({ top: VIEWPORT.height - 32 - CARD.height, left: 32 })
  })

  it('margin·gap을 넘기면 그 값을 그대로 반영한다', () => {
    const pos = chooseCardPosition(CARD, null, VIEWPORT, 16, 4)
    expect(pos).toEqual({ top: VIEWPORT.height - 16 - CARD.height, left: VIEWPORT.width - 16 - CARD.width })
  })
})
