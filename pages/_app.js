import '../styles/globals.css'
import { useLayoutEffect } from 'react'

export default function App({ Component, pageProps }) {
  useLayoutEffect(() => {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init = {}) => {
      let url = typeof input === 'string' ? input : input?.url || ''
      let nextInit = { ...init }

      if (url === '/api/stripe/create-checkout' && (nextInit.method || 'GET').toUpperCase() === 'POST') {
        try {
          const raw = window.localStorage.getItem('nanou_premium_context')
          if (raw) {
            const context = JSON.parse(raw)
            nextInit.headers = { ...(nextInit.headers || {}), 'Content-Type': 'application/json' }
            nextInit.body = JSON.stringify({ context })
          }
        } catch {}
      }

      if (url.startsWith('/api/stripe/verify-checkout')) {
        const current = new URL(window.location.href)
        const readingId = current.searchParams.get('reading_id') || window.localStorage.getItem('nanou_pending_reading_id') || window.localStorage.getItem('nanou_paid_reading_id')
        if (readingId && !url.includes('reading_id=')) {
          url += `${url.includes('?') ? '&' : '?'}reading_id=${encodeURIComponent(readingId)}`
        }
      }

      if (url === '/api/premium/interpret' && (nextInit.method || 'GET').toUpperCase() === 'POST') {
        try {
          const current = new URL(window.location.href)
          const sessionId = current.searchParams.get('session_id') || window.localStorage.getItem('nanou_paid_session_id')
          const readingId = current.searchParams.get('reading_id') || window.localStorage.getItem('nanou_paid_reading_id') || window.localStorage.getItem('nanou_pending_reading_id')
          const existing = nextInit.body ? JSON.parse(nextInit.body) : {}
          nextInit.headers = { ...(nextInit.headers || {}), 'Content-Type': 'application/json' }
          nextInit.body = JSON.stringify({ ...existing, session_id: sessionId, reading_id: readingId })
        } catch {}
      }

      const response = await originalFetch(url, nextInit)

      if (url.startsWith('/api/stripe/verify-checkout') && response.ok) {
        try {
          const clone = response.clone()
          const data = await clone.json()
          if (data.paid && data.reading_id) {
            window.localStorage.setItem('nanou_paid_reading_id', data.reading_id)
            window.localStorage.setItem('nanou_pending_reading_id', data.reading_id)
            if (data.reading_context) {
              window.localStorage.setItem('nanou_premium_context', JSON.stringify(data.reading_context))
            }
          }
        } catch {}
      }

      return response
    }

    return () => { window.fetch = originalFetch }
  }, [])

  return <Component {...pageProps} />
}
