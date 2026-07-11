interface Props {
  onClick: () => void
}

// R8: 재조율 플로우 화면은 만들지 않는다 — 진입점 한 줄만.
export function RescheduleEntryPoint({ onClick }: Props) {
  return (
    <button type="button" onClick={onClick} className="text-xs text-slate-400 underline">
      다시 조율하기
    </button>
  )
}
