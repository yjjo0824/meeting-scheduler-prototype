import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'

interface Props {
  pendingPersonName: string
  respondedCount: number
  total: number
  onClick: () => void
}

// 미응답 상태(리마인드 액션)와 잠정 추천(RecommendationCard)을 분리한 카드 — 요청 흐름과 추천
// 정보를 한 문구에 욱여넣지 않는다.
export function RemindActionCard({ pendingPersonName, respondedCount, total, onClick }: Props) {
  const ratio = total === 0 ? 0 : Math.round((respondedCount / total) * 100)

  return (
    <Card className="flex flex-col justify-between gap-4">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-ink-900">{pendingPersonName} 님의 답변을 기다리고 있어요</h3>
        <p className="mt-heading-gap text-sm text-ink-500">답변이 오면 추천 시간이 달라질 수 있어요.</p>
        <div className="mt-2 flex items-center gap-3" aria-label={`${total}명 중 ${respondedCount}명 답변 완료`}>
          <div className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-muted">
            <div className="h-full rounded-pill bg-brand-500" style={{ width: `${ratio}%` }} />
          </div>
          <span className="whitespace-nowrap text-xs font-bold text-ink-700">
            {respondedCount} / {total}명
          </span>
        </div>
      </div>
      <Button variant="primary" onClick={onClick} data-tour-id="remind-button">
        {pendingPersonName} 님에게 리마인드 보내기
      </Button>
    </Card>
  )
}
