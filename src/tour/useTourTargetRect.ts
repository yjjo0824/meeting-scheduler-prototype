import { useEffect, useState } from 'react'
import { getTourTargetElement } from './TourTargetRegistry'

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

// getBoundingClientRect 기반 대상 측정 — 실제 브라우저 레이아웃에서만 정확히 확인 가능하다.
// TourHighlightRing(스포트라이트)과 TourStepCard(카드 배치 충돌 회피)가 같은 측정치를 공유한다
// (측정 로직을 두 곳에 복제하지 않는다). resize/scroll/ResizeObserver로 재측정하여 칩 추가·삭제
// 등 콘텐츠 높이 변화에도 따라간다.
export function useTourTargetRect(targetId: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    function measure() {
      const el = getTourTargetElement(targetId)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)

    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    const el = getTourTargetElement(targetId)
    if (el) observer.observe(el)

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      observer.disconnect()
    }
  }, [targetId])

  return rect
}
