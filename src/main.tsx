import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SharedDashboardPage } from './components/SharedDashboardPage.tsx'

const shareToken = new URLSearchParams(window.location.search).get('share')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {shareToken ? <SharedDashboardPage token={shareToken} /> : <App />}
  </StrictMode>,
)
