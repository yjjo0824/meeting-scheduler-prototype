interface Props {
  onClick: () => void
}

// "처음부터 다시 보기" = seed.json 리로드 + 투어 재시작(메모리 상태만, 새로고침과 동일한 초기화).
// FreeModeControls의 "다른 역할 체험하기" pill과 같은 스타일 — 평가용 진입점끼리 시각적으로 묶인다.
export function ResetButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-pill border border-border bg-surface px-3 py-2 text-xs font-medium text-ink-700 shadow-card hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      처음부터 다시 보기
    </button>
  )
}
