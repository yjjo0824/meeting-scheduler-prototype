interface Props {
  organizerName: string
}

// R4의 참여자 버전 설명 — "주최자" 같은 역할 명칭 대신 실제 사람 이름으로 말한다(seed에서 파생).
// 제출 CTA 바로 위 중앙 정렬(정본 요구 위치). 문장 중간에서 어색하게 꺾이지 않도록 문장 단위
// 2줄로 고정한다(12C-12.6) — 각 줄은 폰 프레임 폭에서 다시 꺾이지 않는 길이다.
export function TrustNotice({ organizerName }: Props) {
  return (
    <p className="text-center text-xs text-ink-500">
      {organizerName} 님에게는 시간 조건만 보여요.
      <br />
      작성한 문장과 이유는 보이지 않아요.
    </p>
  )
}
