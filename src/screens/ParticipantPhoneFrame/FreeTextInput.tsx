interface Props {
  value: string
  onChange: (value: string) => void
}

export function FreeTextInput({ value, onChange }: Props) {
  return (
    <section className="py-4">
      <label className="block text-lg font-bold tracking-tight text-ink-900" htmlFor="free-text-input">
        여기에 없는 일정이 있나요?
      </label>
      <p className="mt-heading-gap text-xs text-ink-500">피하고 싶은 시간도 편하게 적어주세요.</p>
      {/* 다이얼로그가 편집 폼 상태로 열릴 때(제출 전·다시 조율 편집) 최초 포커스가 여기로 온다. */}
      {/* 포커스 표시(12C-12.4, A안): 브라우저 기본 outline은 rounded-chip 모서리를 따라가지
          않아 잘려 보이므로 끄고, border 색 전환 + radius를 따라가는 ring(box-shadow 기반,
          brand 토큰 — 공용 focus 규칙과 같은 계열)으로 교체한다. */}
      <textarea
        id="free-text-input"
        data-phone-focus-target="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-2 w-full rounded-chip border border-border p-3 text-sm leading-relaxed text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        placeholder="예: 목요일 오전은 개인 사정으로 피하고 싶어요"
      />
    </section>
  )
}
