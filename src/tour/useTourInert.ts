import { useEffect } from 'react'

function getAncestorChain(el: HTMLElement, root: HTMLElement): HTMLElement[] {
  const chain: HTMLElement[] = []
  let node: HTMLElement | null = el
  while (node && node !== root) {
    chain.push(node)
    node = node.parentElement
  }
  chain.push(root)
  return chain
}

// root부터 내려가며, "안전한 가지"(safe) 위에 있지 않은 형제는 전부 inert 처리한다. terminal에
// 속한 노드(= keep 대상 그 자체)에 도달하면 더 내려가지 않고 그 서브트리 전체를 그대로 둔다 —
// 그래야 카드 안의 다른 버튼들(예시 채우기, 체험 시작하기)이나 대상 요소 내부까지 함께 inert가
// 되는 걸 막을 수 있다. z-index 트릭과 달리 inert는 스태킹 컨텍스트를 무시하는 DOM 트리 개념이라,
// "조상은 inert, 후손은 인터랙티브"가 성립하지 않는다 — 그래서 이렇게 가지 단위로 처리한다.
function applyInertExceptSafe(root: HTMLElement, safe: Set<HTMLElement>, terminal: Set<HTMLElement>): HTMLElement[] {
  const changed: HTMLElement[] = []
  function walk(node: HTMLElement) {
    for (const child of Array.from(node.children)) {
      if (!(child instanceof HTMLElement)) continue
      if (terminal.has(child)) continue
      if (safe.has(child)) {
        walk(child)
        continue
      }
      if (!child.inert) {
        child.inert = true
        changed.push(child)
      }
    }
  }
  walk(root)
  return changed
}

// 투어 중에는 카드와 현재 단계의 대상(및 그 안의 모든 것)만 키보드·포인터로 접근 가능해야
// 한다 — keepSelectors로 넘긴 요소들만 살아남고 그 외 앱 영역 전체가 inert 처리된다.
export function useTourInert(active: boolean, keepSelectors: string[]): void {
  useEffect(() => {
    if (!active) return
    if (typeof document === 'undefined') return
    const root = document.getElementById('root')
    if (!root) return

    const keepEls = keepSelectors
      .map((sel) => document.querySelector<HTMLElement>(sel))
      .filter((el): el is HTMLElement => el !== null)
    if (keepEls.length === 0) return

    const safe = new Set<HTMLElement>()
    const terminal = new Set<HTMLElement>(keepEls)
    for (const el of keepEls) {
      for (const ancestor of getAncestorChain(el, root)) safe.add(ancestor)
    }

    // 곧 inert가 될 영역 안에 포커스가 남아있으면 aria-hidden 경고가 발생한다 — inert를 적용하기
    // 전에 안전한 곳으로 먼저 비켜준다(포커스를 어디로 보낼지는 각 화면의 자체 포커스 관리가
    // 뒤이어 결정하므로, 여기서는 blur로 충돌 없이 자리만 비켜준다).
    const activeEl = document.activeElement
    if (activeEl instanceof HTMLElement && root.contains(activeEl) && !safe.has(activeEl)) {
      const insideKeep = keepEls.some((el) => el.contains(activeEl))
      if (!insideKeep) activeEl.blur()
    }

    const changed = applyInertExceptSafe(root, safe, terminal)
    return () => {
      for (const el of changed) el.inert = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, keepSelectors.join('|')])
}
