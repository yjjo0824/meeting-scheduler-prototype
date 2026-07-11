interface Props {
  label?: string
  onClick: () => void
}

export function ConfirmButton({ label = '이 시간으로 확정', onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
    >
      {label}
    </button>
  )
}
