import { useEffect, useRef } from 'react'

// 오버레이가 열리는 순간의 activeElement(트리거)를 기억해뒀다가, active가 false로 바뀌면(닫힘)
// 그 요소로 포커스를 되돌린다 — "닫힌 뒤 열었던 트리거로 포커스 복귀" 요구사항의 공용 구현.
export function useRestoreFocus(active: boolean): void {
  const triggerRef = useRef<HTMLElement | null>(null)
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (typeof document === 'undefined') return

    if (active && !wasActiveRef.current) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    if (!active && wasActiveRef.current) {
      const trigger = triggerRef.current
      if (trigger && document.contains(trigger)) {
        trigger.focus()
      }
      triggerRef.current = null
    }
    wasActiveRef.current = active
  }, [active])

  // unmount 시점에 여전히 active였다면(예: 부모가 통째로 걷힘) 마지막으로 한 번 더 복귀를 시도한다.
  useEffect(() => {
    return () => {
      if (!wasActiveRef.current) return
      const trigger = triggerRef.current
      if (trigger && typeof document !== 'undefined' && document.contains(trigger)) {
        trigger.focus()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
