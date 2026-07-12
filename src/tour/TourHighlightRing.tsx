import type { Rect } from './useTourTargetRect'

interface Props {
  rect: Rect | null
  // 스포트라이트 딤·하이라이트 링(흰 외곽선) 표시 여부 — 단계별 설정(tourSteps.ts의 dim/ring)이
  // 결정하고, 전역 폴백은 TourOverlay의 TOUR_DIM_ENABLED. 둘 다 꺼진 단계에서는 TourOverlay가
  // 이 컴포넌트 자체를 렌더하지 않는다.
  dim: boolean
  ring: boolean
}

// 구멍이 대상 rect보다 사방으로 확장되는 여백(px) — 위치·크기 오프셋(top/left -6, +12)과
// 구멍 radius 가산에 같은 값을 쓴다: 대상 곡률 중심이 동일하게 유지되어야 안팎 곡선이
// 평행하게 보인다(12C-11).
const HOLE_EXPAND = 6

// 구멍의 border-radius = 대상의 computed radius + 확장 여백. 순수 함수로 분리해 DOM 없이 검증한다.
export function holeRadius(targetRadius: number): number {
  return targetRadius + HOLE_EXPAND
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
      className="pointer-events-none fixed z-[850] transition-all duration-200"
      style={{
        top: rect.top - HOLE_EXPAND,
        left: rect.left - HOLE_EXPAND,
        width: rect.width + HOLE_EXPAND * 2,
        height: rect.height + HOLE_EXPAND * 2,
        borderRadius: holeRadius(rect.radius),
        boxShadow: shadows.join(', '),
      }}
    />
  )
}
