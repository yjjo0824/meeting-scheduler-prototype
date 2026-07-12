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

  it('좁은 화면에서는 메인(강조) + 보조(작고 연하게) 2줄 위계로 안내한다', () => {
    // App.test.tsx와 동일한 window 스텁 패턴 — 좁은 폭에서만 배너가 그려진다.
    const original = (globalThis as { window?: unknown }).window
    ;(globalThis as { window?: unknown }).window = { innerWidth: 500 }
    try {
      const html = renderToStaticMarkup(<MobileGuardNotice />)
      const mainIndex = html.indexOf('투어는 PC에서 볼 수 있어요')
      const subIndex = html.indexOf('예시 상황을 따라가며 화면 사용법을 안내해 드려요')
      expect(mainIndex).toBeGreaterThan(-1)
      expect(subIndex).toBeGreaterThan(mainIndex)
      // 메인은 강조(font-bold), 보조는 더 작고 연하다.
      expect(html).toContain('font-bold')
      expect(html).toContain('text-[11px]')
      // 이전 단일 문구는 더 이상 없다.
      expect(html).not.toContain('더 넓은 화면에서 보면')
    } finally {
      if (original === undefined) delete (globalThis as { window?: unknown }).window
      else (globalThis as { window?: unknown }).window = original
    }
  })
})
