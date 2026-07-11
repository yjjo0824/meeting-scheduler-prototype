import type { Person } from '../../types/domain'
import type { ScheduleResult } from '../../types/engine'
import { Badge } from '../../shared/Badge'
import { Card } from '../../shared/Card'

interface Props {
  schedule: ScheduleResult
  people: Person[]
  hasResponded: Record<string, boolean>
}

export function RecommendationCard({ schedule, people, hasResponded }: Props) {
  const pending = people.filter((p) => !hasResponded[p.id])
  const pendingText = pending.map((p) => `${p.name} 님`).join(', ')

  if (schedule.perfectSlots.length === 0) {
    return (
      <Card className="flex flex-col justify-center border border-border">
        <p className="text-base font-bold text-ink-900">완벽하게 맞는 시간이 없어요</p>
        <p className="mt-1 text-sm text-ink-700">트레이드오프 후보를 확인해보세요</p>
      </Card>
    )
  }

  const top = schedule.perfectSlots[0]

  return (
    <Card className="border border-brand-100">
      <Badge tone={pending.length > 0 ? 'warn' : 'brand'}>{pending.length > 0 ? '잠정' : '추천'}</Badge>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
        {top.day}요일 {top.hour}시
      </p>
      <h3 className="mt-1 text-lg font-bold text-ink-900">현재 가장 좋은 시간이에요</h3>
      <p className="mt-1 text-sm text-ink-700">
        {pending.length > 0 ? `${pendingText}의 캘린더 일정만 반영했어요.` : '전원의 조건을 반영했어요.'}
      </p>
    </Card>
  )
}
