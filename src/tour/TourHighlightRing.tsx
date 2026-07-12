import type { Rect } from './useTourTargetRect'

// rect는 TourOverlay가 useTourTargetRect로 한 번만 측정해 내려준다 — TourStepCard의 위치
// 충돌 회피 계산도 같은 측정치를 쓰므로, 여기서 다시 측정하지 않는다(중복 관측자 방지).
export function TourHighlightRing({ rect }: { rect: Rect | null }) {
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
