interface Props {
  onClick: () => void
}

export function FreeModeUnlockButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tour-id="unlock-free-mode-button"
      className="relative rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
    >
      직접 사용해보세요
    </button>
  )
}
