import { RAW_SEED } from '../../data/loadSeed'
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

  return (
    <PageContainer width="narrow">
      {/* 투어 4단계 대상 — 체험 시작 CTA는 더 이상 이 제품 본문에 없다(TourStepCard 안의
          [체험 시작하기]로 이전됨). tabIndex=-1: 투어 종료 시 여기로 포커스를 되돌릴 수 있게.
          확정 결과는 공통 카드 체계(Card) 위에 얹는다 — HostDashboard 카드와 같은 언어. */}
      <Card data-tour-id="confirmation-summary" tabIndex={-1} className="space-y-5 outline-none">
        <ResultSummary meeting={RAW_SEED.meeting} slot={confirmed.slot} display={RAW_SEED.schedule_display} />
        <AttendeeList people={state.people} excludedIds={confirmed.excluded} />
        <CalendarRegisteredLabel />
        <ProcedureTransparencyNote excludedCount={confirmed.excluded.length} />
      </Card>
      <RecalcNote />
      {/* 이 화면의 유일한 행동(12C-12, §7): 확인 = 응답 현황으로 복귀. "다시 조율하기"는 이제
          HostDashboard의 확정 결과 카드에만 있다(R8 — 재조율 진입점 단일화). 투어 중에도 렌더되고
          클릭도 막지 않는다 — NAVIGATE는 투어 상태를 건드리지 않는다(12C-5). history.back() 미사용. */}
      <Button className="w-full" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}>
        확인
      </Button>
    </PageContainer>
  )
}
