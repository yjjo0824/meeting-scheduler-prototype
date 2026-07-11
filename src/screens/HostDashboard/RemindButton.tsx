interface Props {
  pendingPersonName: string | null
  onClick: () => void
}

export function RemindButton({ pendingPersonName, onClick }: Props) {
  if (!pendingPersonName) return null

  return (
    <button type="button" onClick={onClick} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
      리마인드 보내기
    </button>
  )
}
