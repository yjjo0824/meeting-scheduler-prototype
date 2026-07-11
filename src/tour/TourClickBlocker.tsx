// 투어 중 하이라이트된 대상 외 나머지 화면 전체를 잠근다. 대상 요소는 TourOverlay가 주입하는
// 스타일로 z-index를 이 블로커보다 높여, 클릭이 실제로 대상까지 도달하게 한다.
export function TourClickBlocker() {
  return (
    <div
      className="fixed inset-0 z-[800]"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      aria-hidden="true"
    />
  )
}
