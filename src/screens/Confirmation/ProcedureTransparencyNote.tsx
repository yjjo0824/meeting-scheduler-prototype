// R4/R8: 확정 화면은 절차 투명성 수준까지만 — 누구의 무엇을 포기했는지는 재노출하지 않는다.
// TradeoffCandidates의 formatSacrifice와 의도적으로 공유하지 않는 별도 문구다.
export function ProcedureTransparencyNote() {
  return <p className="text-sm text-slate-600">전원 참석 가능한 시간 기준으로 정해졌어요</p>
}
