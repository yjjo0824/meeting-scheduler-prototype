interface Props {
  organizerName: string
}

// R4의 참여자 버전 설명 — "주최자" 같은 역할 명칭 대신 실제 사람 이름으로 말한다(seed에서 파생).
export function TrustNotice({ organizerName }: Props) {
  return (
    <p className="text-xs text-ink-500">
      {organizerName} 님에게는 시간 조건만 보여요. 작성한 문장과 이유는 보이지 않아요.
    </p>
  )
}
