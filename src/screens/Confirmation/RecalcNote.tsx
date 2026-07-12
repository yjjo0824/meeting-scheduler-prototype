// IMPLEMENTATION_SPEC §7의 변수 재계산 안내 — 지금까지 모은 조건이 계속 쓰인다는 R8의 사용자 언어.
export function RecalcNote() {
  return (
    <div className="flex gap-3 p-card-pad-sm">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip bg-surface-muted text-xs font-extrabold text-ink-700"
      >
        ↻
      </span>
      <div>
        <p className="text-sm font-bold text-ink-900">변수가 생기면 이 조건들로 다시 계산해드려요</p>
        <p className="mt-0.5 text-xs text-ink-500">지금까지 모은 조건은 그대로 남아 있어요.</p>
      </div>
    </div>
  )
}
