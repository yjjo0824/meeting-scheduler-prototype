import { useEffect, useRef } from 'react'

// 트리거가 이미 DOM에서 사라졌을 때(예: 닫히는 동안 화면이 전환됨)의 최소 안전망 — 포커스가
// 허공(보이지 않는 이전 요소)에 남지 않도록 body로라도 되돌려, 스크린리더 사용자가 완전히
// 맥락을 잃지 않게 한다. body는 기본적으로 포커스 불가능하므로 tabindex를 순간적으로 부여했다가 제거한다.
function focusFallback() {
  if (typeof document === 'undefined') return
  const body = document.body
  const hadTabIndex = body.hasAttribute('tabindex')
  if (!hadTabIndex) body.setAttribute('tabindex', '-1')
  body.focus()
  if (!hadTabIndex) body.removeAttribute('tabindex')
}

// 오버레이가 열리는 순간의 activeElement(트리거)를 기억해뒀다가, active가 false로 바뀌면(닫힘)
// 그 요소로 포커스를 되돌린다 — "닫힌 뒤 열었던 트리거로 포커스 복귀" 요구사항의 공용 구현.
// 이 훅을 쓰는 컴포넌트에서는 반드시 useFocusTrap보다 먼저 호출해야 한다: 두 훅의 effect가 같은
// 커밋에서 등록되는데, effect는 호출 순서대로 실행되므로 트리거 캡처가 먼저 끝나야 그 다음의
// 초기 포커스 이동(useFocusTrap)이 activeElement를 오염시키지 않는다.
export function useRestoreFocus(active: boolean): void {
  const triggerRef = useRef<HTMLElement | null>(null)
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    if (active && !wasActiveRef.current) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }

    let frame: number | undefined
    if (!active && wasActiveRef.current) {
      const trigger = triggerRef.current
      triggerRef.current = null
      // 다이얼로그는 이미 이 커밋에서 unmount됐지만, 실제 DOM 반영이 한 프레임 더 안정된 뒤에
      // 포커스를 옮긴다(언마운트 직후 순간을 피해 안정적으로 포커스가 걸리게 한다).
      frame = requestAnimationFrame(() => {
        if (trigger && document.contains(trigger)) {
          trigger.focus()
        } else {
          focusFallback()
        }
      })
    }

    wasActiveRef.current = active
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [active])

  // unmount 시점에 여전히 active였다면(예: 부모가 통째로 걷힘) 마지막으로 한 번 더 복귀를 시도한다.
  useEffect(() => {
    return () => {
      if (!wasActiveRef.current) return
      const trigger = triggerRef.current
      if (trigger && typeof document !== 'undefined' && document.contains(trigger)) {
        trigger.focus()
      } else if (typeof document !== 'undefined') {
        focusFallback()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
