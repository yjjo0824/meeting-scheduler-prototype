import { attendanceLabel, buildConditionSummary } from '../../presentation/conditionCopy'
import type { Person } from '../../types/domain'
import { Badge } from '../../shared/Badge'

interface Props {
  people: Person[]
  hasResponded: Record<string, boolean>
  onSelectPerson: (personId: string) => void
}

// 데스크톱 조건 지도(40슬롯 표)를 축소하지 않고, 참여자 한 명당 한 줄 + 조건 건수 요약만 보여준다.
// 상세 조건은 탭해서 들어가는 PersonDetailPanel(재사용)에서 요일별로 전부 확인한다(R4: 사유·원문 없음).
// Card를 그대로 쓰지 않는 이유: Card의 기본 p-6과 여기 필요한 무패딩(줄마다 자체 여백)이
// 유틸리티 클래스 우선순위 충돌을 일으킬 수 있어, 같은 시각 톤(rounded-card/bg-surface/shadow-card)만
// 가져와 직접 구성한다.
export function MobileParticipantList({ people, hasResponded, onSelectPerson }: Props) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-card bg-surface shadow-card">
      <p className="p-4 text-sm font-bold text-ink-900">참여자 ({people.length})</p>
      {people.map((person) => {
        const responded = hasResponded[person.id]
        const conditionCount = buildConditionSummary([person]).length
        return (
          <button
            key={person.id}
            type="button"
            onClick={() => onSelectPerson(person.id)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-ink-900">
                {person.name}
                <Badge tone="neutral">{attendanceLabel(person.attendance)}</Badge>
                {!responded && <Badge tone="warn">답변 전</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">
                {person.job} · 조건 {conditionCount}건
              </p>
            </div>
            <span className="shrink-0 text-ink-500" aria-hidden="true">
              ›
            </span>
          </button>
        )
      })}
    </div>
  )
}
