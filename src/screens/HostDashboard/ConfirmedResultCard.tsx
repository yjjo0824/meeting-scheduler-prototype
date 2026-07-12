import { useState } from 'react'
import { formatSlotTimeRange } from '../../presentation/dateDisplay'
import type { Slot } from '../../types/engine'
import { Badge } from '../../shared/Badge'
import { Card } from '../../shared/Card'
import { RescheduleConfirmDialog } from './RescheduleConfirmDialog'

interface Props {
  slot: Slot
  onReschedule: () => void
}

// IMPLEMENTATION_SPEC §4(12C-12): 확정 상태에서는 잠정 추천 카드 대신 이 확정 결과 카드를
// 보여준다 — 확정 시간(강조)·캘린더 등록 라벨·"다시 조율하기" 진입점. 재조율은 여기서만
// 진입한다(R8 — 확정 상태에서 트레이드오프로 가는 다른 제품 경로를 두지 않는다).
// 다시 조율하기는 낮은 위계 텍스트 링크(12C-12.1)이고, 실제 확정 해제는 확인 대화상자를
// 거쳐야만 실행된다.
export function ConfirmedResultCard({ slot, onReschedule }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <Card className="border border-brand-100">
      <Badge tone="success">확정 완료</Badge>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
        {formatSlotTimeRange(slot)}
      </p>
      <p className="mt-3 inline-block rounded-chip bg-surface-muted px-3 py-2 text-xs text-ink-700">
        참석자 캘린더에 등록됐어요
      </p>
      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="px-1 py-1.5 text-xs text-ink-500 underline hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          다시 조율하기
        </button>
      </div>
      <RescheduleConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onReschedule()
        }}
      />
    </Card>
  )
}
