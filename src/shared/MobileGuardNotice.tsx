import { MOBILE_BREAKPOINT_PX, isNarrowViewport, useIsNarrowViewport } from './useIsNarrowViewport'

// IMPLEMENTATION_SPEC §1: 기준 환경은 데스크톱. 좁은 화면에서는 권장 안내 배너만 띄우고
// 제품 화면은 그대로 둔다(SPEC §6 축약 대응 — 차단이 아니다). 브레이크포인트는
// useIsNarrowViewport로 단일화되어 있다(재수출은 기존 소비처 호환용).
export { MOBILE_BREAKPOINT_PX, isNarrowViewport }

export function MobileGuardNotice() {
  const narrow = useIsNarrowViewport()

  if (!narrow) return null

  return (
    <div className="border-b border-warn-100 bg-warn-50 px-4 py-2 text-center">
      <p className="text-xs font-bold text-warn-600">투어는 PC에서 볼 수 있어요</p>
      <p className="mt-0.5 text-[11px] text-warn-600/80">예시 상황을 따라가며 화면 사용법을 안내해 드려요</p>
    </div>
  )
}
