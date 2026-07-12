import { useEffect, useRef } from 'react'
import { Button } from '../../shared/Button'
import { useBodyScrollLock } from '../../shared/useBodyScrollLock'
import { useFocusTrap } from '../../shared/useFocusTrap'
import { useRestoreFocus } from '../../shared/useRestoreFocus'

interface Props {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

// "다시 조율하기" 확인 대화상자(12C-12.1) — 확정 해제는 참여자에게 알림이 가는 상태 변경이라
// 낮은 위계 링크 뒤에 한 번 더 확인을 둔다. ParticipantPhoneFrame과 동일한 dialog 패턴 재사용:
// useRestoreFocus(트리거 캡처)를 useFocusTrap(초기 포커스 이동)보다 먼저 호출해야 닫을 때
// 링크로 정확히 복귀한다(12B-3에서 확립한 순서). 초기 포커스는 트랩 기본값(첫 포커스 가능
// 요소) = 취소 버튼 — 비파괴 행동이 기본이 되게 한다.
export function RescheduleConfirmDialog({ open, onCancel, onConfirm }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useRestoreFocus(open)
  useFocusTrap(panelRef, open)
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[800] bg-black/40" onClick={onCancel} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-dialog-title"
        className="fixed left-1/2 top-1/2 z-[810] w-[22rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-card-pad shadow-elevated"
      >
        <h2 id="reschedule-dialog-title" className="text-lg font-bold text-ink-900">
          다시 조율할까요?
        </h2>
        <p className="mt-2 text-sm text-ink-700">
          확정이 해제되고 참여자에게 알림이 가요. 지금까지의 응답과 조건은 그대로 유지돼요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            취소
          </Button>
          {/* 확인을 눌렀을 때만 REOPEN_FOR_RESCHEDULE이 실행된다(호출부 배선). */}
          <Button size="sm" onClick={onConfirm}>
            다시 조율하기
          </Button>
        </div>
      </div>
    </>
  )
}
