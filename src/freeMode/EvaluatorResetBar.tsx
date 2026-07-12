import { useAppState } from '../state/AppContext'
import { ResetButton } from './ResetButton'

// "다른 역할 체험하기"(현재 상태에서 역할·화면만 전환)와 의미가 다른 독립된 평가용 액션 —
// seed 초기화 + 투어 재시작을 담당한다. 데스크톱·모바일 모두 "다른 역할 체험하기" pill(우측
// 하단) 바로 위에 같은 스타일로 둔다(12C-5) — 평가용 진입점 두 개가 한 자리에 모여 있되,
// 역할 체험 패널 안에는 넣지 않는다(역할 전환과 전체 리셋은 별개라는 확정된 UX 결정).
// freeModeUnlocked와 무관하게 항상 마운트한다 — 투어 중에도 눌러서 처음부터 다시 볼 수 있다
// (RESET_ALL이 곧 투어 재시작이므로 투어 상태를 깨는 게 아니라 처음으로 되돌리는 것이다).
export function EvaluatorResetBar() {
  const { dispatch } = useAppState()

  return (
    <div className="fixed bottom-16 right-4 z-[700]">
      <ResetButton onClick={() => dispatch({ type: 'RESET_ALL' })} />
    </div>
  )
}
