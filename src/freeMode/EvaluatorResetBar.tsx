import { useAppState } from '../state/AppContext'
import { ResetButton } from './ResetButton'

// "다른 역할 체험하기"(현재 상태에서 역할·화면만 전환)와 의미가 다른 독립된 평가용 액션 —
// seed 초기화 + 투어 재시작을 담당한다. 우측 하단 스택의 맨 아래(bottom-4)가 이 버튼의 고정
// 기준점이다(12C-7): freeModeUnlocked와 무관하게 항상 마운트되는 유일한 진입점이므로, 투어
// 중(체험하기 없음)에도 이 자리에 있고 체험하기가 나타나도(그 위 bottom-16) 움직이지 않는다.
// 데스크톱·모바일 동일 규칙. 역할 체험 패널 안에는 넣지 않는다(역할 전환과 전체 리셋은
// 별개라는 확정된 UX 결정). RESET_ALL이 곧 투어 재시작이므로 투어 중 클릭도 안전하다.
export function EvaluatorResetBar() {
  const { dispatch } = useAppState()

  return (
    <div className="fixed bottom-4 right-4 z-[700]">
      <ResetButton onClick={() => dispatch({ type: 'RESET_ALL' })} />
    </div>
  )
}
