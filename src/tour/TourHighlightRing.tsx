import type { Rect } from './useTourTargetRect'

interface Props {
  rect: Rect | null
  // 스포트라이트 딤 표시 여부 — 폰 프레임이 떠 있는 동안에는 프레임 자체 딤과 겹치지 않도록
  // 끄고 링(흰 외곽선)만 남긴다. 전역 폴백은 TourOverlay의 TOUR_DIM_ENABLED.
  dim: boolean
}

// rect는 TourOverlay가 useTourTargetRect로 한 번만 측정해 내려준다 — TourStepCard의 위치
// 충돌 회피 계산도 같은 측정치를 쓰므로, 여기서 다시 측정하지 않는다(중복 관측자 방지).
// pointer-events-none: 딤은 시각 안내 전용이며 어떤 클릭도 가로채지 않는다(IMPLEMENTATION_SPEC §3).
export function TourHighlightRing({ rect, dim }: Props) {
  if (!rect) return null

  const ringShadow = '0 0 0 2px rgba(255, 255, 255, 0.9)'
  const dimShadow = '0 0 0 9999px rgba(25, 31, 40, 0.6)'

  return (
    <div
      className="pointer-events-none fixed z-[850] rounded-lg transition-all duration-200"
      style={{
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        boxShadow: dim ? `${dimShadow}, ${ringShadow}` : ringShadow,
      }}
    />
  )
}
