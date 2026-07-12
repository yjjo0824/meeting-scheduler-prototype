interface Props {
  value: string
  onChange: (value: string) => void
}

export function FreeTextInput({ value, onChange }: Props) {
  return (
    <div className="space-y-1 py-3">
      <label className="block text-sm font-medium text-slate-700" htmlFor="free-text-input">
        캘린더에 없는 일정이 있나요?
      </label>
      <p className="text-xs text-slate-400">피하고 싶은 시간도 편하게 적어주세요.</p>
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
