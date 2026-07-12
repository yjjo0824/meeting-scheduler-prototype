import { formatDisplayDate } from '../../presentation/dateDisplay'
import type { ScheduleDisplay } from '../../types/domain'
import type { Slot } from '../../types/engine'
import { Badge } from '../../shared/Badge'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'

interface Props {
  slot: Slot
  display: ScheduleDisplay
  onReschedule: () => void
}

// IMPLEMENTATION_SPEC §4(12C-12): 확정 상태에서는 잠정 추천 카드 대신 이 확정 결과 카드를
// 보여준다 — 확정 시간(강조)·캘린더 등록 라벨·"다시 조율하기" 진입점. 재조율은 여기서만
// 진입한다(R8 — 확정 상태에서 트레이드오프로 가는 다른 제품 경로를 두지 않는다).
export function ConfirmedResultCard({ slot, display, onReschedule }: Props) {
  return (
    <Card className="border border-brand-100">
      <Badge tone="success">확정 완료</Badge>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
        {formatDisplayDate(slot.day, slot.hour, display)}
      </p>
      <p className="mt-3 inline-block rounded-chip bg-surface-muted px-3 py-2 text-xs text-ink-700">
        참석자 캘린더에 등록됐어요
      </p>
      {/* 다시 조율하기 = 화면 이동이 아니라 상태 변경(확정 해제 + 재계산) — 보조 설명으로 못박는다. */}
      <div className="mt-4 space-y-1">
        <Button variant="secondary" size="sm" onClick={onReschedule}>
          다시 조율하기
        </Button>
        <p className="text-xs text-ink-500">확정을 해제하고 후보를 다시 계산해요</p>
      </div>
    </Card>
  )
}
