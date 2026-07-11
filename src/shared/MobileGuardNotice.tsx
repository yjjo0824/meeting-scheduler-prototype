import { useEffect, useState } from 'react'

// IMPLEMENTATION_SPEC §1: 기준 환경은 데스크톱. 모바일 접속 시 안내만 표시하고 막지는 않는다.
export const MOBILE_BREAKPOINT_PX = 768

export function isNarrowViewport(width: number): boolean {
  return width < MOBILE_BREAKPOINT_PX
}

function getViewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT_PX
}

// CSS 미디어쿼리(md:hidden)에만 의존하지 않고, 뷰포트 폭을 직접 읽어 실제로 표시 여부를 결정한다.
export function MobileGuardNotice() {
  const [width, setWidth] = useState(getViewportWidth)

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isNarrowViewport(width)) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">
      PC에서 보시길 권장해요
    </div>
  )
}
