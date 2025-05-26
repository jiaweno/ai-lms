import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from '@/router/AppRouter'
import { useAuth } from '@/hooks/useAuth'
import '@/styles/globals.css'
import { HelmetProvider } from 'react-helmet-async' // For SEO and dynamic titles

function App() {
  // Initialize auth on app start
  useAuth()

  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="App">
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App
