// IMPLEMENTATION_SPEC §1: 기준 환경은 데스크톱. 모바일 접속 시 안내만 표시하고 막지는 않는다.
export function MobileGuardNotice() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700 md:hidden">
      PC에서 보시길 권장해요
    </div>
  )
}
