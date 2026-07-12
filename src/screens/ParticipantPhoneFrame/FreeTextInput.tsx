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
      {/* 포커스 시각 표시 없음(12C-12.7 — 12.4의 ring도 모서리가 잘려 보여 완전 제거): outline·
          ring·border 전환 없이 포커스 전후 외곽이 동일하다. 이 textarea 한정 예외이며 버튼 등
          다른 요소의 focus-visible 규칙과 무관하다. 플레이스홀더는 포커스 즉시 투명 처리(비어
          있으면 블러 시 다시 보임), 리사이즈 핸들 제거 — 크기·문구·동작은 현행 그대로다. */}
      <textarea
        id="free-text-input"
        data-phone-focus-target="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-2 w-full resize-none rounded-chip border border-border p-3 text-sm leading-relaxed text-ink-900 outline-none placeholder:text-ink-500 focus:placeholder:text-transparent"
        placeholder="예: 목요일 오전은 개인 사정으로 피하고 싶어요"
      />
    </section>
  )
}
