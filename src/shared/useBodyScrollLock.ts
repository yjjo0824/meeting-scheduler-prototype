import { useEffect } from 'react'

// 투어와 폰 프레임(다이얼로그)이 동시에 열려 있을 수 있다(투어 2단계의 대상 자체가 phone-frame이다) —
// 두 오버레이가 각자 훅 인스턴스로 잠그고 풀면, 먼저 닫힌 쪽이 body.style.overflow를 복구해버려
// 아직 열려 있는 나머지 오버레이의 잠금이 풀리는 문제가 생긴다. 모듈 레벨 카운터로 "몇 개가 잠그고
// 있는지"를 세어, 마지막 오버레이가 닫힐 때만 실제로 복구한다(중첩 오버레이 잠금 해제 순서 안정화).
let lockCount = 0
let previousOverflow: string | null = null

function acquire() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

function release() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? ''
    previousOverflow = null
  }
}

// active=true인 동안 body 스크롤을 잠근다. unmount 시(또는 active가 false로 바뀌면) 반드시 release해
// 카운터가 새지 않게 한다.
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    if (typeof document === 'undefined') return
    acquire()
    return () => release()
  }, [active])
}
