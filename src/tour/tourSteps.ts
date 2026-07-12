import { RAW_SEED } from '../data/loadSeed'
import type { AppState } from '../state/appState.types'

export interface TourStep {
  id: string
  targetId: string
  title: string
  body: string
  // 딤(스포트라이트)·하이라이트 링 표시 여부 — IMPLEMENTATION_SPEC §3: 단계별로 필요한 곳에만
  // 최소로 사용한다. 끈 단계도 이 플래그만 되돌리면 다시 살릴 수 있다(12C-6).
  dim: boolean
  ring: boolean
  // 비트2에서만 채워진다 — seed에서 파생(하드코딩 아님), "예시 문장 채우기" 버튼에 쓰인다.
  exampleRaw?: string
  // 마지막 단계에만 있다 — 카드 안의 실제 버튼(가짜 "다음" 버튼이 아니라 진짜 UNLOCK_FREE_MODE를
  // 수행하는 CTA)에 쓰는 라벨. 이 CTA가 투어 종료와 체험 기능 잠금 해제를 함께 담당한다.
  ctaLabel?: string
  // 현재 단계의 목표가 달성됐는지 — 실제 버튼 클릭이 만든 상태 변화를 감시한다(가짜 "다음" 버튼이 아님).
  isComplete: (state: AppState) => boolean
}

const doyunRaw = RAW_SEED.people.find((p) => p.id === 'doyun')?.response.raw ?? undefined

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'host',
    targetId: 'remind-button',
    title: '아직 한 명이 답하지 않았어요',
    body: '현재 추천은 도윤 님의 캘린더 일정만 반영한 잠정 결과예요. 도윤 님에게 리마인드를 보내보세요.',
    // 첫 단계는 대시보드에서 리마인드 카드 하나로 시선을 모아야 하므로 딤+링을 모두 쓴다(현행 유지).
    dim: true,
    ring: true,
    isComplete: (state) => state.phoneFrame.open,
  },
  {
    id: 'phone',
    // 폰 디바이스 전체(ParticipantPhoneFrame의 패널 루트)가 대상이다 — 입력 영역만 좁게 잡으면
    // 하이라이트 링이 부자연스럽게 헤더/제출 버튼을 어색하게 감싼다(12B-3 QA). 카피로 자연어
    // 입력 → 조건 확인 → 제출 흐름을 설명한다.
    targetId: 'phone-frame',
    title: '캘린더에 없는 조건도 받을 수 있어요',
    body: '말하듯 적으면 시스템이 시간 조건으로 정리해요. 보내기 전에 직접 확인할 수 있어요. 예시를 채운 뒤 응답을 보내보세요.',
    // 폰 프레임은 자기 딤(배경 스크림)을 이미 갖고 있고 화면 중앙의 유일한 초점이라, 투어 딤도
    // 링(흰 외곽선)도 얹지 않는다(12C-6: 이중 안내 제거).
    dim: false,
    ring: false,
    exampleRaw: doyunRaw,
    isComplete: (state) => !state.phoneFrame.open && state.hasResponded.doyun,
  },
  {
    id: 'tradeoff',
    targetId: 'tradeoff-screen',
    title: '새 조건 때문에 추천이 달라졌어요',
    body: '모두 참석하는 안과 원하는 시간을 지키는 안을 비교할 수 있어요. 후보와 시간을 고른 뒤 확정해보세요.',
    // 화면 전체가 곧 안내 대상이라 딤·링이 오히려 소음이다 — 플래그로 되살릴 수 있다.
    dim: false,
    ring: false,
    isComplete: (state) => state.confirmedMeeting !== null,
  },
  {
    id: 'confirmation',
    // Confirmation.tsx의 결과 요약 영역(제품 본문의 "직접 사용해보세요" 버튼에는 더 이상
    // 의존하지 않는다 — 완료 CTA는 이 카드 안의 ctaLabel 버튼으로 옮겨졌다).
    targetId: 'confirmation-summary',
    title: '이제 직접 바꿔볼 수 있어요',
    body: '조건을 바꾸면 후보가 바로 다시 계산돼요.',
    // 확정 화면도 결과 카드 하나뿐이라 딤·링 없이 카드 안내만으로 충분하다 — 플래그로 되살릴 수 있다.
    dim: false,
    ring: false,
    ctaLabel: '체험 시작하기',
    isComplete: (state) => state.freeModeUnlocked,
  },
]
