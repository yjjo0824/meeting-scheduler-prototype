import type { Person } from '../../types/domain'
import type { ScheduleResult } from '../../types/engine'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { Badge } from '../../shared/Badge'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'

interface Props {
  schedule: ScheduleResult
  people: Person[]
  hasResponded: Record<string, boolean>
  // 데스크톱에서만 전달된다 — 모바일은 화면 하단의 [후보 시간 비교하기] CTA가 같은 역할을 하므로
  // 카드 안에 중복 CTA를 두지 않는다.
  onOpenCandidates?: () => void
}

// 잠정/확정 추천 카드 — 상태(응답 전 / 전원 응답 + 완벽 없음 / 전원 응답 + 완벽 존재)에 따라
// 배지·제목·행동이 달라진다. 모든 수치(후보 수·추천 시간·미응답자 이름)는 현재 계산 결과와
// 상태에서 파생한다(seed 하드코딩 금지).
export function RecommendationCard({ schedule, people, hasResponded, onOpenCandidates }: Props) {
  const pending = people.filter((p) => !hasResponded[p.id])
  const pendingText = pending.map((p) => `${p.name} 님`).join(', ')
  const allResponded = pending.length === 0

  // 전원 응답 + 완벽 슬롯 없음: 후보 비교가 다음 행동이다.
  if (schedule.perfectSlots.length === 0) {
    const candidateCount = schedule.groups.length
    return (
      <Card className="border border-brand-100">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone={allResponded ? 'brand' : 'warn'}>
              {allResponded ? `${people.length}명 모두 답변` : '잠정 추천'}
            </Badge>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-ink-900">
              {candidateCount > 0 ? `조건이 다른 후보 ${candidateCount}개를 찾았어요` : '가능한 시간이 없어요'}
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              {candidateCount > 0
                ? '참석 인원과 원하는 시간을 비교해 결정해보세요.'
                : '필수/선택 분류나 조건을 조정해보세요.'}
            </p>
          </div>
          {onOpenCandidates && candidateCount > 0 && (
            <Button onClick={onOpenCandidates}>후보 시간 비교하기</Button>
          )}
        </div>
      </Card>
    )
  }

  const top = schedule.perfectSlots[0]

  // 완벽 슬롯 존재: 응답 전이면 잠정 추천(주요 행동은 리마인드 — CTA 없음),
  // 전원 응답이면 확인만 남은 상태라 후보 화면의 한 줄 모드로 보낸다.
  return (
    <Card className="border border-brand-100">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone={allResponded ? 'brand' : 'warn'}>
            {allResponded ? `${people.length}명 모두 답변` : '잠정 추천'}
          </Badge>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">{formatSlotLabel(top)}</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-ink-900">
            {allResponded ? '모두 괜찮은 시간이 있어요' : '현재 가장 좋은 시간이에요'}
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            {allResponded ? '전원의 조건을 반영했어요.' : `${pendingText}의 캘린더 일정만 반영했어요.`}
          </p>
        </div>
        {onOpenCandidates && allResponded && <Button onClick={onOpenCandidates}>이 시간 확인하기</Button>}
      </div>
    </Card>
  )
}