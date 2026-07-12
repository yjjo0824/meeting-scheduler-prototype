interface Props {
  excludedCount: number
}

// R4/R8: 확정 화면은 절차 투명성 수준까지만 — 누구의 무엇을 포기했는지는 재노출하지 않는다.
// 실제 선택 결과(제외자 유무)에 맞춰 결정 절차를 설명하되, 후보 화면의 구체 조건 문구와는
// 의도적으로 공유하지 않는 별도 문구다.
export function ProcedureTransparencyNote({ excludedCount }: Props) {
  return (
    <p className="text-sm text-slate-600">
      {excludedCount === 0
        ? '전원 참석 가능한 시간 기준으로 정해졌어요'
        : '필수 참석자 모두가 가능한 시간 기준으로 정해졌어요'}
    </p>
  )
}
