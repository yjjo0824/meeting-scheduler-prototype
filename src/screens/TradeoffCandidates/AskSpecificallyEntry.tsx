import { useState } from 'react'

// R2/자유 모드 깊이: 진입점만 존재하고 상세 플로우는 만들지 않는다(투어 미포함).
export function AskSpecificallyEntry() {
  const [sent, setSent] = useState(false)

  return (
    <button
      type="button"
      disabled={sent}
      onClick={() => setSent(true)}
      className="px-1 py-1.5 text-xs text-ink-500 underline hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:text-brand-600 disabled:no-underline"
    >
      {sent ? '요청을 보냈어요' : '참여자에게 다시 확인하기'}
    </button>
  )
}
