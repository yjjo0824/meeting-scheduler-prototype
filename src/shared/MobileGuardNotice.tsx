import { MOBILE_BREAKPOINT_PX, isNarrowViewport, useIsNarrowViewport } from './useIsNarrowViewport'

// IMPLEMENTATION_SPEC §1: 기준 환경은 데스크톱. 좁은 화면에서는 권장 안내 배너만 띄우고
// 제품 화면은 그대로 둔다(SPEC §6 축약 대응 — 차단이 아니다). 브레이크포인트는
// useIsNarrowViewport로 단일화되어 있다(재수출은 기존 소비처 호환용).
export { MOBILE_BREAKPOINT_PX, isNarrowViewport }

export function MobileGuardNotice() {
  const narrow = useIsNarrowViewport()

  if (!narrow) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">
      더 넓은 화면에서 보면 참여자들의 시간 조건을 한눈에 비교하기 쉬워요. 전체 투어는 PC에서 볼 수 있어요.
    </div>
  )
}
