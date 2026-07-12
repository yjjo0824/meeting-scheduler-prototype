import { useState } from 'react'

// R2/자유 모드 깊이: 진입점만 존재하고 상세 플로우는 만들지 않는다(투어 미포함).
export function AskSpecificallyEntry() {
  const [sent, setSent] = useState(false)

  return (
    <button
      type="button"
      disabled={sent}
      onClick={(e) => {
        // 카드 컨테이너 전체가 선택 타깃(onClick=onSelect)이 됐으므로, 이 보조 링크의 클릭이
        // 카드 선택으로 전파되지 않게 여기서 끊는다(12C-8).
        e.stopPropagation()
        setSent(true)
      }}
      className="px-1 py-1.5 text-xs text-ink-500 underline hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:text-brand-600 disabled:no-underline"
    >
      {sent ? '요청을 보냈어요' : '참여자에게 다시 확인하기'}
    </button>
  )
}
