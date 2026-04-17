import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/customer.css'
import App from './App.jsx'
import { sb } from './lib/supabase.js'

const CACHE_KEY = 'fofitos_qr_dest_v1'
const CACHE_TTL = 8 * 60 * 1000 // 8 minutes

function isFofitos(url) {
  return !url || url.trim() === '' || url.includes('fofitos.com')
}

function getCached() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (c && Date.now() - c.ts < CACHE_TTL) return c.url
  } catch {}
  return null // cache miss
}

export function setQRCache(url) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ url: url || '', ts: Date.now() }))
}

// ── 1. Synchronous cache check — happens BEFORE React loads ──
const cached = getCached()
if (cached !== null && !isFofitos(cached)) {
  // Instant redirect from cache — React never even starts
  window.location.replace(cached)
} else {
  // ── 2. No cache hit — start React, fetch from Supabase in background ──
  if (cached === null) {
    // Cache miss: fetch from Supabase to populate cache for next scan
    sb.from('qr_links').select('url').eq('id', '1').single()
      .then(({ data }) => {
        const dest = data?.url?.trim() || ''
        setQRCache(dest)
        if (!isFofitos(dest)) {
          window.location.replace(dest)
        }
      })
      .catch(() => setQRCache(''))
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
