import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MOBILE_BREAKPOINT_PX, getViewportWidth, isNarrowViewport, useIsNarrowViewport } from '../useIsNarrowViewport'

describe('useIsNarrowViewport 유틸 — MobileGuardNotice/HostDashboard/appReducer가 공유하는 단일 기준', () => {
  it('768px 미만이면 좁은 화면으로 판정한다', () => {
    expect(isNarrowViewport(767)).toBe(true)
    expect(isNarrowViewport(375)).toBe(true)
  })

  it('768px 이상이면 데스크톱으로 판정한다(경계값 포함)', () => {
    expect(isNarrowViewport(MOBILE_BREAKPOINT_PX)).toBe(false)
    expect(isNarrowViewport(1280)).toBe(false)
  })

  it('window가 없는 환경(SSR 상당)에서는 데스크톱 폭(MOBILE_BREAKPOINT_PX)으로 간주한다', () => {
    expect(getViewportWidth()).toBe(MOBILE_BREAKPOINT_PX)
  })

  it('useIsNarrowViewport를 쓰는 컴포넌트는 SSR에서 항상 데스크톱(false)으로 초기화된다', () => {
    function Probe() {
      const narrow = useIsNarrowViewport()
      return <span>{narrow ? 'narrow' : 'wide'}</span>
    }
    expect(renderToStaticMarkup(<Probe />)).toContain('wide')
  })
})
