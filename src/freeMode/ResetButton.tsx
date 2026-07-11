interface Props {
  onClick: () => void
}

// "처음부터 다시 보기" = seed.json 리로드 + 투어 재시작(메모리 상태만, 새로고침과 동일한 초기화).
export function ResetButton({ onClick }: Props) {
  return (
    <button type="button" onClick={onClick} className="text-xs text-slate-400 underline">
      처음부터 다시 보기
    </button>
  )
}
