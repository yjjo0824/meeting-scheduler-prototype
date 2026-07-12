import type { Person } from '../../types/domain'
import type { CandidateGroup } from '../../types/engine'
import {
  formatAttendMetric,
  formatConsiderations,
  formatPreferenceMetric,
} from '../../presentation/candidateCopy'

// 비교 지표 2개(참석 인원 / 원하는 시간) — 추천 카드와 다른 안이 같은 지표 박스를 공유한다.
// 데스크톱 2열, 좁은 폭 1열(반응형). 값은 전부 엔진 결과에서 파생, cost는 읽지 않는다.
export function CandidateComparison({ group }: { group: CandidateGroup }) {
  const metrics = [
    { label: '참석 인원', value: formatAttendMetric(group) },
    { label: '원하는 시간', value: formatPreferenceMetric(group) },
  ]

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-chip bg-surface-muted p-3">
          <span className="block text-xs text-ink-500">{metric.label}</span>
          <strong className="mt-heading-gap block text-sm font-bold text-ink-900">{metric.value}</strong>
        </div>
      ))}
    </div>
  )
}

// 고려할 점 — 포기 내용을 주의 톤으로 구분해 강조한다(주체 명시 — R2/R4 악용 대응).
export function ConsiderationNote({ group, people }: { group: CandidateGroup; people: Person[] }) {
  const items = formatConsiderations(group, people)
  if (items.length === 0) return null

  return (
    <div className="rounded-chip bg-warn-50 px-3 py-2.5">
      <p className="text-xs font-bold text-warn-600">고려할 점</p>
      <p className="mt-heading-gap text-xs text-ink-700">{items.join(' ')}</p>
    </div>
  )
}
