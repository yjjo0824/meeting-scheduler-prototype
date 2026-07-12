import { RAW_SEED } from '../../data/loadSeed'
import { formatDisplayDate } from '../../presentation/dateDisplay'
import { useAppState } from '../../state/AppContext'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { PageContainer } from '../../shared/PageContainer'
import { AttendeeList } from './AttendeeList'
import { CalendarRegisteredLabel } from './CalendarRegisteredLabel'
import { ProcedureTransparencyNote } from './ProcedureTransparencyNote'
import { RecalcNote } from './RecalcNote'
import { ResultSummary } from './ResultSummary'

export function Confirmation() {
  const { state, dispatch } = useAppState()
  const confirmed = state.confirmedMeeting
  if (!confirmed) return null

  const attendeeCount = state.people.length - confirmed.excluded.length

  return (
    <PageContainer width="narrow">
      {/* 투어 4단계 대상 — 체험 시작 CTA는 더 이상 이 제품 본문에 없다(TourStepCard 안의
          [체험 시작하기]로 이전됨). tabIndex=-1: 투어 종료 시 여기로 포커스를 되돌릴 수 있게.
          12D-3 구조(참고안): 성공 헤더 → "확정 시간" 카드(시간·참석자) → 안내 3항목 리스트. */}
      <div data-tour-id="confirmation-summary" tabIndex={-1} className="space-y-section outline-none">
        <ResultSummary meeting={RAW_SEED.meeting} />

        <Card className="space-y-3">
          <div>
            <span className="text-xs font-bold text-ink-500">확정 시간</span>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900">
              {formatDisplayDate(confirmed.slot.day, confirmed.slot.hour, RAW_SEED.schedule_display)}
            </p>
          </div>
          <AttendeeList people={state.people} excludedIds={confirmed.excluded} />
        </Card>

        {/* 안내 항목 리스트(아이콘 + 제목 + 보조) — Card와 같은 표면 토큰을 쓰되 항목별
            구분선을 위해 padding을 항목 쪽(p-card-pad-sm)에 둔다. */}
        <div className="divide-y divide-border rounded-card bg-surface-card shadow-card">
          <CalendarRegisteredLabel attendeeCount={attendeeCount} />
          <ProcedureTransparencyNote excludedCount={confirmed.excluded.length} />
          <RecalcNote />
        </div>
      </div>
      {/* 이 화면의 유일한 행동(12C-12, §7): 확인 = 응답 현황으로 복귀. "다시 조율하기"는
          HostDashboard의 확정 결과 카드에만 있다(R8 — 재조율 진입점 단일화). 투어 중에도 렌더되고
          클릭도 막지 않는다 — NAVIGATE는 투어 상태를 건드리지 않는다(12C-5). history.back() 미사용. */}
      <Button className="w-full" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}>
        확인
      </Button>
    </PageContainer>
  )
}
