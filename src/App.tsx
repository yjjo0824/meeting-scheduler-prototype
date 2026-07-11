import { AppProvider } from './state/AppContext'
import { HostDashboard } from './screens/HostDashboard/HostDashboard'

function App() {
  return (
    <AppProvider>
      <HostDashboard />
    </AppProvider>
  )
}

export default App
