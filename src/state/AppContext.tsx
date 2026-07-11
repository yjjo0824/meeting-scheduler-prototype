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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, buildInitialState)
  const schedule = useSchedule(state)
  const value = useMemo(() => ({ state, dispatch, schedule }), [state, schedule])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState는 AppProvider 내부에서만 사용할 수 있습니다')
  return ctx
}
