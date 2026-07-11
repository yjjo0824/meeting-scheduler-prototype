import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MOBILE_BREAKPOINT_PX, MobileGuardNotice, isNarrowViewport } from '../MobileGuardNotice'

describe('isNarrowViewport — 뷰포트 폭 기준 순수 함수', () => {
  it('768px 미만이면 좁은 화면으로 판정한다', () => {
    expect(isNarrowViewport(767)).toBe(true)
    expect(isNarrowViewport(375)).toBe(true)
  })

  it('768px 이상이면 데스크톱으로 판정한다(경계값 포함)', () => {
    expect(isNarrowViewport(MOBILE_BREAKPOINT_PX)).toBe(false)
    expect(isNarrowViewport(1280)).toBe(false)
  })
})

describe('MobileGuardNotice', () => {
  it('window가 없는 렌더 환경(SSR 상당)에서는 데스크톱 기본값으로 간주해 아무것도 그리지 않는다', () => {
    // react-dom/server는 useEffect를 실행하지 않고, 이 환경엔 window가 없다 —
    // 컴포넌트는 window 부재 시 데스크톱 폭(MOBILE_BREAKPOINT_PX)을 기본값으로 삼는다.
    const html = renderToStaticMarkup(<MobileGuardNotice />)
    expect(html).toBe('')
  })
})
