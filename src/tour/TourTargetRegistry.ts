// 각 화면의 실제 DOM 노드에 data-tour-id를 붙여두고(RemindActionCard, ParticipantPhoneFrame,
// TradeoffCandidates, FreeModeUnlockButton 등), 투어 오버레이가 현재 단계의 대상을 이 속성으로 찾는다.
// React 트리를 가로지르는 ref 전달 없이도 "이 화면 어딘가에 있는 그 요소"를 안정적으로 찾을 수 있다.
export function getTourTargetElement(targetId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`)
}
