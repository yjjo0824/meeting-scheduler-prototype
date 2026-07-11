import { useEffect, useState } from 'react'

// IMPLEMENTATION_SPEC §1: 기준 환경은 데스크톱. 모바일 접속 시 안내만 표시하고 막지는 않는다.
export const MOBILE_BREAKPOINT_PX = 768

export function isNarrowViewport(width: number): boolean {
  return width < MOBILE_BREAKPOINT_PX
}

function getViewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT_PX
}

// matchMedia는 브라우저 창 리사이즈·줌 등 뷰포트 폭이 바뀌는 모든 경우를 표준적으로 감지한다
// (resize 이벤트 하나에만 기대는 것보다 신뢰도가 높다). resize 리스너는 폴백으로 함께 둔다.
export function MobileGuardNotice() {
  const [narrow, setNarrow] = useState(() => isNarrowViewport(getViewportWidth()))

  useEffect(() => {
    if (typeof window === 'undefined') return

    function syncFromWidth() {
      setNarrow(isNarrowViewport(window.innerWidth))
    }

    syncFromWidth()
    window.addEventListener('resize', syncFromWidth)

    if (typeof window.matchMedia === 'function') {
      const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`)
      const handleChange = () => setNarrow(query.matches)
      query.addEventListener('change', handleChange)
      return () => {
        window.removeEventListener('resize', syncFromWidth)
        query.removeEventListener('change', handleChange)
      }
    }

    return () => window.removeEventListener('resize', syncFromWidth)
  }, [])

  if (!narrow) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">
      PC에서 보시길 권장해요
    </div>
  )
}
