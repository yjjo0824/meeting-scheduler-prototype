import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RescheduleConfirmDialog } from '../RescheduleConfirmDialog'

// 열림/닫힘 전환과 실제 포커스 트랩·복귀는 클릭·effect가 필요해 SSR로 재현할 수 없다(프로젝트
// 공통 한계) — ParticipantPhoneFrame과 동일한 훅 순서(useRestoreFocus → useFocusTrap →
// useBodyScrollLock)를 재사용하는 배선은 코드 검토로 확인했다. 여기서는 열린 상태의 구조와
// 카피, 닫힌 상태의 미렌더만 검증한다.
describe('RescheduleConfirmDialog — 다시 조율 확인 대화상자(12C-12.1)', () => {
  it('닫힌 상태에서는 아무것도 렌더하지 않는다', () => {
    const html = renderToStaticMarkup(<RescheduleConfirmDialog open={false} onCancel={() => {}} onConfirm={() => {}} />)
    expect(html).toBe('')
  })

  it('열린 상태: role=dialog + aria-modal + 제목 연결, 지정 카피가 정확히 보인다', () => {
    const html = renderToStaticMarkup(<RescheduleConfirmDialog open onCancel={() => {}} onConfirm={() => {}} />)
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-labelledby="reschedule-dialog-title"')
    expect(html).toContain('id="reschedule-dialog-title"')
    expect(html).toContain('다시 조율할까요?')
    expect(html).toContain('확정이 해제되고 참여자에게 알림이 가요. 지금까지의 응답과 조건은 그대로 유지돼요.')
  })

  it('버튼 위계: 취소는 secondary, 다시 조율하기는 primary — 취소가 먼저 온다(첫 포커스 대상 = 비파괴 기본)', () => {
    const html = renderToStaticMarkup(<RescheduleConfirmDialog open onCancel={() => {}} onConfirm={() => {}} />)
    const cancelIndex = html.indexOf('>취소<')
    const confirmIndex = html.indexOf('>다시 조율하기<')
    expect(cancelIndex).toBeGreaterThan(-1)
    expect(confirmIndex).toBeGreaterThan(cancelIndex)
    const cancelTag = html.slice(html.lastIndexOf('<button', cancelIndex), cancelIndex)
    const confirmTag = html.slice(html.lastIndexOf('<button', confirmIndex), confirmIndex)
    expect(cancelTag).toContain('bg-action-secondary')
    expect(confirmTag).toContain('bg-action-primary')
  })
})
