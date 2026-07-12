import type { ReactNode } from 'react'

// 폰 프레임 공용 빈 상태 박스 — 캘린더의 "화–금에는 등록된 일정이 없어요"와 칩 검수의
// "아직 추가한 조건이 없어요"가 같은 형태를 공유한다(크기·패딩·모서리·색 단일 정의,
// CSS 중복 작성 금지).
export function PhoneEmptyNotice({ children }: { children: ReactNode }) {
  return <p className="rounded-chip bg-surface-muted px-3 py-2.5 text-xs text-ink-700">{children}</p>
}
