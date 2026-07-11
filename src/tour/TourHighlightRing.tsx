import { useEffect, useState } from 'react'
import { getTourTargetElement } from './TourTargetRegistry'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

// getBoundingClientRect 기반 스포트라이트 — 실제 브라우저 레이아웃에서만 정확히 확인 가능하다.
// resize/scroll/ResizeObserver로 재측정하여 칩 추가·삭제 등 콘텐츠 높이 변화에도 따라간다.
export function TourHighlightRing({ targetId }: { targetId: string }) {
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

  if (!rect) return null

  return (
    <div
      className="pointer-events-none fixed z-[850] rounded-lg transition-all duration-200"
      style={{
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        boxShadow: '0 0 0 9999px rgba(15,23,42,0.6), 0 0 0 2px rgba(255,255,255,0.9)',
      }}
    />
  )
}
