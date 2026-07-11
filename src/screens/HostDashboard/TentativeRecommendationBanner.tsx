import type { Person } from '../../types/domain'
import type { ScheduleResult } from '../../types/engine'

interface Props {
  schedule: ScheduleResult
  people: Person[]
  hasResponded: Record<string, boolean>
}

export function TentativeRecommendationBanner({ schedule, people, hasResponded }: Props) {
  const pending = people.filter((p) => !hasResponded[p.id])
  const pendingText = pending.map((p) => `${p.name} 님`).join(', ') + (pending.length > 0 ? ' 응답 전이에요' : '')

  if (schedule.perfectSlots.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        완벽하게 맞는 시간이 없어요 · 트레이드오프 후보를 확인해보세요
      </div>
    )
  }

  const top = schedule.perfectSlots[0]
  const label = pending.length > 0 ? '잠정 추천' : '추천'

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
      {label}: {top.day}요일 {top.hour}시 · 확정 일정 기준{pending.length > 0 ? ` · ${pendingText}` : ''}
    </div>
  )
}
