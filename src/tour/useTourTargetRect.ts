import { useEffect, useState } from 'react'
import { getTourTargetElement } from './TourTargetRegistry'

export interface Rect {
  top: number
  left: number
  width: number
  height: number
  // 대상 요소의 computed border-radius(px) — 하이라이트 구멍이 대상의 곡률을 따라가게 한다
  // (12C-11: 구멍 라운드가 대상보다 작으면 pill 형태 대상의 네 모서리에 흰 귀퉁이가 남는다).
  radius: number
}

// getBoundingClientRect 기반 대상 측정 — 실제 브라우저 레이아웃에서만 정확히 확인 가능하다.
// TourHighlightRing(스포트라이트)과 TourStepCard(카드 배치 충돌 회피)가 같은 측정치를 공유한다
// (측정 로직을 두 곳에 복제하지 않는다). resize/scroll/ResizeObserver로 재측정하여 칩 추가·삭제
// 등 콘텐츠 높이 변화에도 따라간다.
export function useTourTargetRect(targetId: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    function measure() {
      const el = getTourTargetElement(targetId)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      // 대상의 실제 곡률을 읽는다(하드코딩 금지 — 다른 요소를 하이라이트해도 재발하지 않게).
      // 네 모서리가 다른 경우는 이 제품에 없어 좌상단 값을 대표로 쓰고, px 아닌 단위(%)는
      // parseFloat 근사로 충분하다. 9999px(pill)처럼 과대한 값은 브라우저가 박스 절반으로
      // 자동 클램프하므로 그대로 통과시킨다.
      const radius = Number.parseFloat(window.getComputedStyle(el).borderTopLeftRadius) || 0
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, radius })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    // CSS transition(예: ParticipantPhoneFrame의 등장 scale/opacity 애니메이션)은 resize도
    // scroll도 발생시키지 않는다 — getBoundingClientRect는 transform까지 반영해 측정 도중의
    // 중간값을 그대로 돌려주므로, 트랜지션이 끝나는 시점에 한 번 더 재측정해야 최종 위치로
    // 안정화된다(capture 단계라 중첩 요소의 트랜지션도 놓치지 않는다).
    document.addEventListener('transitionend', measure, true)

    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    const el = getTourTargetElement(targetId)
    if (el) observer.observe(el)

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      document.removeEventListener('transitionend', measure, true)
      observer.disconnect()
    }
  }, [targetId])

  return rect
}
