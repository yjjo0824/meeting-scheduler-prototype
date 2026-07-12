interface Props {
  excludedCount: number
}

// R4/R8: 확정 화면은 절차 투명성 수준까지만 — 누구의 무엇을 포기했는지는 재노출하지 않는다
// (참고안의 구체 포기 보조문은 이 원칙 때문에 채택하지 않았다). 실제 선택 결과(제외자 유무)에
// 맞춰 결정 절차를 설명하되, 후보 화면의 구체 조건 문구와는 의도적으로 공유하지 않는 별도 문구다.
export function ProcedureTransparencyNote({ excludedCount }: Props) {
  return (
    <div className="flex gap-3 p-card-pad-sm">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip bg-surface-muted text-xs font-extrabold text-ink-700"
      >
        i
      </span>
      <p className="self-center text-sm font-bold text-ink-900">
        {excludedCount === 0
          ? '전원 참석 가능한 시간 기준으로 정해졌어요'
          : '필수 참석자 모두가 가능한 시간 기준으로 정해졌어요'}
      </p>
    </div>
  )
}
