interface Props {
  value: string
  onChange: (value: string) => void
}

export function FreeTextInput({ value, onChange }: Props) {
  return (
    <div className="space-y-1 py-3">
      <label className="text-sm font-medium text-slate-700" htmlFor="free-text-input">
        여기 없는 일정이나 피하고 싶은 시간이 있나요?
      </label>
      <textarea
        id="free-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-slate-200 p-2 text-sm"
        placeholder="예: 목요일 오전은 개인 사정으로 피하고 싶어요"
      />
    </div>
  )
}
