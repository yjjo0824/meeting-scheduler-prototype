import type { CandidateGroup, Slot } from '../../types/engine'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { PageContainer } from '../../shared/PageContainer'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  tentative: boolean
  onBack: () => void
  onConfirm: (slot: Slot) => void
}

// R2 한 줄 모드: 완벽 슬롯이 존재하면 그것은 "포기 0건 후보군" 하나다 — 별도 코드 경로가 아니라
// 같은 그룹 객체를 특수 렌더링하는 것뿐이다.
export function OneLineRecommendation({ group, tentative, onBack, onConfirm }: Props) {
  const slot = group.defaultSlot
  const otherSlotsCount = group.slots.length - 1

  return (
    // 바깥 컨테이너는 프레임 3·4 공통(content), 내부는 기존 폭(narrow) 유지 — Confirmation과 동일 규칙.
    <PageContainer width="content">
      <div className="mx-auto w-full max-w-content-narrow space-y-section">
      {/* tradeoff-screen 대상 바깥(형제)에 둔다 — 투어 중에는 다른 비대상 요소처럼 inert
          처리되어, 눌러도 투어 상태를 깨지 않는다(TradeoffCandidates.tsx와 동일한 이유, 12B-4 QA). */}
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-ink-700 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        ← 응답 현황으로
      </button>

      <div className="relative" data-tour-id="tradeoff-screen">
        <Card className="space-y-3">
          {tentative && <TentativeBadge />}
          <p className="text-base text-ink-900">
            모두 괜찮은 시간이 있어요. <span className="font-bold">{formatSlotLabel(slot)}</span>, 확정할까요?
            {otherSlotsCount > 0 && <span className="text-ink-500"> (다른 시간 {otherSlotsCount}개)</span>}
          </p>
          <Button onClick={() => onConfirm(slot)}>{formatSlotLabel(slot)}로 확정하기</Button>
        </Card>
      </div>
      </div>
    </PageContainer>
  )
}
