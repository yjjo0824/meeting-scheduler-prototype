import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
}

// containerRef 안에서만 Tab/Shift+Tab이 순환하게 한다(다이얼로그 표준 포커스 트랩). getInitialFocus가
// 있으면 활성화되는 순간(effect가 도는 시점의 실제 DOM을 기준으로) 그 요소로 포커스를 옮기고,
// 없으면 컨테이너 안의 첫 포커스 가능 요소로 옮긴다. ref 하나가 아니라 함수를 받는 이유: 다이얼로그
// 상태(제출 전/제출 완료/잠금 등)에 따라 "첫 포커스 대상"이 렌더마다 달라질 수 있어서다.
// resetKey: active가 계속 true인 채로 "보고 있는 대상"만 바뀌는 경우(예: 역할 체험에서 프레임을
// 닫지 않고 다른 사람으로 바로 전환)에도 초기 포커스를 다시 계산하려면, active 하나만으로는
// effect가 재실행되지 않는다 — 세션을 구분하는 값(예: personId+open)을 함께 넘긴다.
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  getInitialFocus?: () => HTMLElement | null,
  resetKey?: string | number,
): void {
  useEffect(() => {
    if (!active) return
    const rawContainer = containerRef.current
    if (!rawContainer) return
    const container: HTMLElement = rawContainer

    const toFocus = getInitialFocus?.() ?? getFocusable(container)[0] ?? container
    // 배경을 inert/aria-hidden 처리하기 전에 포커스를 다이얼로그 내부로 먼저 옮겨야, 숨겨질 영역
    // 안에 포커스가 남아 발생하는 aria-hidden 경고를 피할 수 있다 — 트랩 설치 시점에 바로 옮긴다.
    toFocus.focus()

    // 방어적 보정: 같은 커밋에서 다른 레이어의 포커스 조작(blur 등)이 방금 옮긴 포커스를
    // 빼앗아갈 수 있다(12B-3 QA에서 실제 발생 — 당시 원인이던 투어 inert는 12C-5에서 제거됐지만,
    // 보정 자체는 저비용 안전망이라 유지한다). 한 프레임 뒤 포커스가 컨테이너 안에 안착했는지
    // 한 번만 확인해 벗어나 있으면 동일 대상으로 다시 옮긴다 — 무한 루프가 아니라 딱 한 번의 rAF.
    const correctionFrame = requestAnimationFrame(() => {
      if (!container.contains(document.activeElement)) {
        toFocus.focus()
      }
    })

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = getFocusable(container)
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (current === last || !container.contains(current)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(correctionFrame)
      document.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, resetKey])
}
