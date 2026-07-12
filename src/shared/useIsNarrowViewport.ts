import { useEffect, useState } from 'react'

// IMPLEMENTATION_SPEC §1: 기준 환경은 데스크톱이지만, 좁은 화면에서도 주최자 핵심 과업은
// 수행할 수 있어야 한다(SPEC §6 축약 대응). 이 값이 MobileGuardNotice와 HostDashboard의
// 모바일 조기 반환, 초기 투어 활성화 여부까지 전부 공유하는 단일 기준점이다.
export const MOBILE_BREAKPOINT_PX = 768

export function isNarrowViewport(width: number): boolean {
  return width < MOBILE_BREAKPOINT_PX
}

// SSR(react-dom/server)에는 window가 없다 — 이 경우 데스크톱 폭으로 간주한다(기존 테스트가
// 가정하는 기본 동작과 동일하게 유지하기 위함).
export function getViewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT_PX
}

// matchMedia는 브라우저 창 리사이즈·줌 등 뷰포트 폭이 바뀌는 모든 경우를 표준적으로 감지한다
// (resize 이벤트 하나에만 기대는 것보다 신뢰도가 높다). resize 리스너는 폴백으로 함께 둔다.
export function useIsNarrowViewport(): boolean {
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

  return narrow
}
