import { useAppState } from '../state/AppContext'
import { useIsNarrowViewport } from '../shared/useIsNarrowViewport'
import { ResetButton } from './ResetButton'

// "다른 역할 체험하기"(현재 상태에서 역할·화면만 전환)와 의미가 다른 독립된 평가용 액션 —
// seed 초기화 + 투어 재시작을 담당한다. 역할 체험 패널(FreeModeControls) 안에 함께 있으면 "역할
// 전환"과 "전체 리셋"이 같은 위계로 보여 오해를 살 수 있어(12B-3 QA), 앱 상단의 별도 보조
// 액션으로 분리했다. freeModeUnlocked 여부와 무관하게 항상 마운트한다 — 투어 진행 중에는 다른
// 모든 비대상 요소와 마찬가지로 useTourInert가 이 버튼도 inert 처리하므로(카드/현재 대상만
// 예외), 투어 중 실수로 리셋되는 일 없이 "Esc로 투어를 먼저 끝내야 누를 수 있다"는 기존 동선이
// 자연히 유지된다.
export function EvaluatorResetBar() {
  const { dispatch } = useAppState()
  const narrow = useIsNarrowViewport()
  const button = <ResetButton onClick={() => dispatch({ type: 'RESET_ALL' })} />

  if (narrow) {
    // 모바일: 하단 역할 체험 패널과 경쟁하지 않도록 상단 보조 메뉴 영역(MobileGuardNotice 바로
    // 아래)에 한 줄로 둔다.
    return <div className="border-b border-slate-100 bg-white px-4 py-1.5 text-right">{button}</div>
  }

  // 데스크톱: 역할 체험 패널(우측 하단)과 시각적으로 분리된 우측 상단, 제품 CTA보다 낮은 위계의
  // 텍스트 버튼.
  return <div className="fixed right-4 top-3 z-[600]">{button}</div>
}
