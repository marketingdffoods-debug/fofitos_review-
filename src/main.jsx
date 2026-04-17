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

function getCached(qrId) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY + qrId))
    if (c && Date.now() - c.ts < CACHE_TTL) return c.url
  } catch {}
  return null // cache miss
}

export function setQRCache(qrId, url) {
  localStorage.setItem(CACHE_KEY + qrId, JSON.stringify({ url: url || '', ts: Date.now() }))
}

export function clearQRCache(qrId) {
  localStorage.removeItem(CACHE_KEY + qrId)
}

// Only redirect if URL has ?qr= param (i.e. actually scanned from QR code)
const params = new URLSearchParams(window.location.search)
const qrId   = params.get('qr') // '1', '2', or null

if (qrId) {
  // ── Came from QR scan ── check for redirect
  const cached = getCached(qrId)

  if (cached !== null && !isFofitos(cached)) {
    // Instant redirect from cache — React never starts
    window.location.replace(cached)
  } else {
    // No cache or no redirect — still render app, but fetch in background to warm cache
    if (cached === null) {
      sb.from('qr_links').select('url').eq('id', qrId).single()
        .then(({ data }) => {
          const dest = data?.url?.trim() || ''
          setQRCache(qrId, dest)
          if (!isFofitos(dest)) {
            window.location.replace(dest)
          }
        })
        .catch(() => setQRCache(qrId, ''))
    }
    createRoot(document.getElementById('root')).render(
      <StrictMode><App /></StrictMode>
    )
  }
} else {
  // ── Normal visit (typed URL / bookmark / link) — never redirect ──
  createRoot(document.getElementById('root')).render(
    <StrictMode><App /></StrictMode>
  )
}
