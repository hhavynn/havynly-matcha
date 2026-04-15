import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'

// HashRouter is required for GitHub Pages — all routes become /#/route
// so the static server always serves index.html and the client handles routing.
// AuthProvider lives inside HashRouter so useNavigate works inside the context.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
)
