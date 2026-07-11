import { RAW_SEED } from '../data/loadSeed'
import type { AppState } from '../state/appState.types'

export interface TourStep {
  id: string
  targetId: string
  title: string
  body: string
  // 카드가 하이라이트 대상의 실제 CTA를 가리지 않도록 단계별로 반대쪽 모서리에 둔다.
  // (예: 폰 프레임은 화면 우측을 도킹 패널로 차지하므로 카드는 좌측에 둔다.)
  placement: 'left' | 'right'
  // 비트2에서만 채워진다 — seed에서 파생(하드코딩 아님), "예시 문장 채우기" 버튼에 쓰인다.
  exampleRaw?: string
  // 현재 단계의 목표가 달성됐는지 — 실제 버튼 클릭이 만든 상태 변화를 감시한다(가짜 "다음" 버튼이 아님).
  isComplete: (state: AppState) => boolean
}

const doyunRaw = RAW_SEED.people.find((p) => p.id === 'doyun')?.response.raw ?? undefined

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'host',
    targetId: 'remind-button',
    placement: 'right',
    title: '주최자 뷰에서 시작해요',
    body: '6명 중 5명이 응답했고, 도윤 님만 아직이에요. 잠정 추천은 확정 일정 기준으로만 계산된 상태예요. [리마인드 보내기]를 눌러보세요.',
    isComplete: (state) => state.phoneFrame.open,
  },
  {
    id: 'phone',
    targetId: 'phone-frame',
    placement: 'left',
    title: '도윤 님이 되어 입력해보세요',
    body: '여기 없는 일정이나 피하고 싶은 시간을 적어보세요. 시스템이 칩으로 정리해드려요. 다 됐으면 응답 보내기를 눌러주세요.',
    exampleRaw: doyunRaw,
    isComplete: (state) => !state.phoneFrame.open && state.hasResponded.doyun,
  },
  {
    id: 'tradeoff',
    targetId: 'tradeoff-screen',
    placement: 'right',
    title: '도윤 님의 응답이 도착했어요',
    body: '캘린더에 없던 일정이 발견되어 추천 시간이 다시 계산됐어요. 후보 중 하나를 확정해보세요.',
    isComplete: (state) => state.confirmedMeeting !== null,
  },
  {
    id: 'confirmation',
    targetId: 'unlock-free-mode-button',
    placement: 'left',
    title: '확정됐어요',
    body: '조건을 바꿔보세요 — 후보가 실시간으로 다시 계산됩니다',
    isComplete: (state) => state.freeModeUnlocked,
  },
]
