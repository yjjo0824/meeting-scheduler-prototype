import type { Rect } from './useTourTargetRect'

interface Props {
  rect: Rect | null
  // 스포트라이트 딤·하이라이트 링(흰 외곽선) 표시 여부 — 단계별 설정(tourSteps.ts의 dim/ring)이
  // 결정하고, 전역 폴백은 TourOverlay의 TOUR_DIM_ENABLED. 둘 다 꺼진 단계에서는 TourOverlay가
  // 이 컴포넌트 자체를 렌더하지 않는다.
  dim: boolean
  ring: boolean
}

// rect는 TourOverlay가 useTourTargetRect로 한 번만 측정해 내려준다 — 중복 관측자 방지.
// pointer-events-none: 딤은 시각 안내 전용이며 어떤 클릭도 가로채지 않는다(IMPLEMENTATION_SPEC §3).
export function TourHighlightRing({ rect, dim, ring }: Props) {
  if (!rect) return null

  const shadows = [
    dim ? '0 0 0 9999px rgba(25, 31, 40, 0.6)' : null,
    ring ? '0 0 0 2px rgba(255, 255, 255, 0.9)' : null,
  ].filter(Boolean)
  if (shadows.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed z-[850] rounded-lg transition-all duration-200"
      style={{
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        boxShadow: shadows.join(', '),
      }}
    />
  )
}
