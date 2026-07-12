import { Button } from '../../shared/Button'

interface Props {
  onClick: () => void
}

// R8: 재조율 플로우 화면은 만들지 않는다 — 진입점 한 줄만. 주요 결과(확정 카드)보다 강하지
// 않지만 충분히 찾을 수 있는 secondary 위계(공용 Button 규칙)로 둔다.
export function RescheduleEntryPoint({ onClick }: Props) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      다시 조율하기
    </Button>
  )
}
