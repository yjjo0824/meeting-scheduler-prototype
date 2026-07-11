import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { appReducer, buildInitialState } from './appReducer'
import { useSchedule } from './useSchedule'
import type { AppState } from './appState.types'
import type { Action } from './actions'
import type { ScheduleResult } from '../types/engine'

interface AppContextValue {
  state: AppState
  dispatch: Dispatch<Action>
  schedule: ScheduleResult
}

const AppContext = createContext<AppContextValue | null>(null)

interface AppProviderProps {
  children: ReactNode
  // 테스트에서 특정 상태 스냅샷을 그대로 렌더링하기 위한 주입 지점 — 기본 앱 동작에는 쓰이지 않는다.
  initialState?: AppState
}

export function AppProvider({ children, initialState }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => initialState ?? buildInitialState())
  const schedule = useSchedule(state)
  const value = useMemo(() => ({ state, dispatch, schedule }), [state, schedule])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState는 AppProvider 내부에서만 사용할 수 있습니다')
  return ctx
}
