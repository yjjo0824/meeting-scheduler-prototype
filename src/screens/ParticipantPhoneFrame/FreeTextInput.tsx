interface Props {
  value: string
  onChange: (value: string) => void
}

export function FreeTextInput({ value, onChange }: Props) {
  return (
    <section className="space-y-1 py-4">
      <label className="block text-lg font-bold tracking-tight text-ink-900" htmlFor="free-text-input">
        여기에 없는 일정이 있나요?
      </label>
      <p className="text-xs text-ink-500">피하고 싶은 시간도 편하게 적어주세요.</p>
      {/* 다이얼로그가 편집 폼 상태로 열릴 때(제출 전·다시 조율 편집) 최초 포커스가 여기로 온다. */}
      <textarea
        id="free-text-input"
        data-phone-focus-target="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-1 w-full rounded-chip border border-border p-3 text-sm leading-relaxed text-ink-900 placeholder:text-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        placeholder="예: 목요일 오전은 개인 사정으로 피하고 싶어요"
      />
    </section>
  )
}
