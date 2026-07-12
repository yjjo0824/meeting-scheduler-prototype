import type { Person } from '../../types/domain'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'

interface Props {
  reporters: Person[]
  onOpenConfirmation: () => void
}

// 확정 후 참여자가 "이 시간에 참석하기 어려워졌어요"를 보내면 주최자가 추측 없이 알 수 있게
// 하는 상태 알림 — 상세 신고 플로우는 없다(R8: 재조율 진입점은 Confirmation의 "다시 조율하기"
// 단일 지점 유지, 여기서 바로 재조율을 실행하지 않는다). 이름은 reportedByPersonId에서 파생.
export function ReportNoticeCard({ reporters, onOpenConfirmation }: Props) {
  if (reporters.length === 0) return null
  const names = reporters.map((p) => `${p.name} 님`).join(', ')

  return (
    <Card className="border border-warn-600/30 bg-warn-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink-900">
            {names}이 확정된 시간에 참석하기 어렵다고 알려왔어요
          </h3>
          <p className="mt-1 text-sm text-ink-700">다시 조율할지는 주최자가 결정할 수 있어요.</p>
        </div>
        <Button variant="secondary" onClick={onOpenConfirmation}>
          확정 결과 확인하기
        </Button>
      </div>
    </Card>
  )
}
