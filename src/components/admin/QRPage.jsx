import { useState, useEffect } from 'react'
import QRCodeLib from 'qrcode'
import fofitosLogo from '../../assets/qr.png'
import { sb } from '../../lib/supabase'

const URL = 'https://www.fofitos.com'
const SIZE = 480

async function buildQR() {
  const qrDataUrl = await QRCodeLib.toDataURL(URL, {
    width: SIZE, margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  const qrImg = new Image()
  await new Promise(r => { qrImg.onload = r; qrImg.src = qrDataUrl })
  ctx.drawImage(qrImg, 0, 0, SIZE, SIZE)

  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE * 0.14
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore()

  const logo = new Image()
  await new Promise(res => { logo.onload = res; logo.src = fofitosLogo })
  const logoR = r - 2
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, logoR, 0, Math.PI * 2)
  ctx.clip(); ctx.drawImage(logo, cx - logoR, cy - logoR, logoR * 2, logoR * 2); ctx.restore()

  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(91,33,182,0.25)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore()

  return canvas.toDataURL('image/png')
}

/* Shared QR image — generated once, reused across all 12 cards */
function useSharedQR() {
  const [qrUrl, setQrUrl] = useState('')
  useEffect(() => { buildQR().then(setQrUrl) }, [])
  return qrUrl
}

function QRCard({ num, qrUrl }) {
  const id = String(num)
  const [downloading, setDownloading] = useState(false)
  const [dest,    setDest]    = useState('')
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    sb.from('qr_links').select('url').eq('id', id).single()
      .then(({ data }) => {
        const url = data?.url || ''
        setDest(url); setInput(url); setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function handleSave() {
    const trimmed = input.trim()
    if (!trimmed) return
    setSaving(true)
    const { error } = await sb.from('qr_links').upsert({ id, url: trimmed }, { onConflict: 'id' })
    setSaving(false)
    if (!error) {
      setDest(trimmed)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else alert('Save failed: ' + error.message)
  }

  function handleCopy() {
    navigator.clipboard.writeText(dest)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!qrUrl) return
    setDownloading(true)
    const a = document.createElement('a')
    a.download = `fofitos-qr-${num}.png`
    a.href = qrUrl
    a.click()
    setTimeout(() => setDownloading(false), 1200)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      border: '1px solid #ECEDF2',
      boxShadow: '0 2px 16px rgba(91,33,182,0.07)',
      padding: '20px 16px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      {/* Label */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1A1A2E' }}>QR Code {num}</div>
        <span style={{
          fontSize: '0.56rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
          color: '#2CB67D', background: 'rgba(44,182,125,0.10)', borderRadius: 50, padding: '3px 8px',
        }}>Permanent</span>
      </div>

      {/* QR image */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: -10, borderRadius: 16,
          background: 'linear-gradient(135deg,rgba(91,33,182,0.06),rgba(124,58,237,0.02))',
          border: '1.5px dashed rgba(91,33,182,0.18)',
        }}/>
        <div style={{
          background: '#fff', padding: 10, borderRadius: 12,
          position: 'relative', zIndex: 1,
          boxShadow: '0 2px 12px rgba(91,33,182,0.10)',
        }}>
          {qrUrl
            ? <img src={qrUrl} alt={`QR ${num}`} style={{ width: 160, height: 160, display: 'block' }} />
            : <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 24, height: 24, border: '3px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              </div>
          }
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontWeight: 800, fontSize: '0.6rem', letterSpacing: '2px', color: '#7C3AED', textTransform: 'uppercase' }}>
          FOFiTOS Kitchen
        </div>
      </div>

      {/* Permanent URL */}
      <div style={{
        width: '100%', background: 'rgba(44,182,125,0.06)',
        border: '1.5px solid rgba(44,182,125,0.30)',
        borderRadius: 8, padding: '7px 10px',
        fontSize: '0.72rem', fontWeight: 700, color: '#16A34A',
        textAlign: 'center',
      }}>
        🔒 www.fofitos.com — Fixed forever
      </div>

      {/* Redirects to */}
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9A98A8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          Redirects to
        </div>
        <div style={{
          background: 'rgba(91,33,182,0.04)', border: '1px solid rgba(91,33,182,0.12)',
          borderRadius: 10, padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 40,
        }}>
          {loading
            ? <span style={{ fontSize: '0.72rem', color: '#C0BBCC', fontStyle: 'italic' }}>Loading…</span>
            : dest
              ? <>
                  <span style={{ fontSize: '0.72rem', color: '#5B21B6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{dest}</span>
                  <button onClick={handleCopy} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#2CB67D' : '#7C3AED', fontSize: '0.68rem', fontWeight: 700 }}>
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </>
              : <span style={{ fontSize: '0.72rem', color: '#C0BBCC', fontStyle: 'italic' }}>No destination set</span>
          }
        </div>
      </div>

      {/* Change destination */}
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9A98A8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          Change destination URL
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="https://your-new-link.com"
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 10,
              border: '1.5px solid #ECEDF2', fontFamily: 'Outfit, sans-serif',
              fontSize: '0.78rem', color: '#1A1A2E', outline: 'none', background: '#FAFAFA',
            }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#ECEDF2'}
          />
          <button
            onClick={handleSave} disabled={saving}
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: 'none',
              background: saved ? '#2CB67D' : 'linear-gradient(135deg,#5B21B6,#7C3AED)',
              color: '#fff', fontFamily: 'Outfit, sans-serif',
              fontSize: '0.78rem', fontWeight: 700,
              cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '…' : saved ? '✓ Saved' : 'Apply'}
          </button>
        </div>
        <div style={{ fontSize: '0.6rem', color: '#C0BBCC', marginTop: 4 }}>Saved to cloud — works on every device instantly.</div>
      </div>

      {/* Download */}
      <button
        onClick={handleDownload}
        disabled={!qrUrl}
        style={{
          width: '100%', padding: '9px', borderRadius: 10,
          border: '1.5px solid #ECEDF2',
          background: downloading ? 'rgba(91,33,182,0.08)' : '#FAFAFA',
          color: downloading ? '#7C3AED' : '#5B21B6',
          fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem', fontWeight: 600,
          cursor: qrUrl ? 'pointer' : 'default', opacity: qrUrl ? 1 : 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (qrUrl && !downloading) { e.currentTarget.style.background = 'rgba(91,33,182,0.06)'; e.currentTarget.style.borderColor = '#7C3AED' }}}
        onMouseLeave={e => { if (!downloading) { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#ECEDF2' }}}
      >
        {downloading ? <>✓ Downloading…</> : (
          <>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Download PNG
          </>
        )}
      </button>
    </div>
  )
}

export default function QRPage() {
  const qrUrl = useSharedQR()
  const [dlAll, setDlAll] = useState(false)

  async function downloadAll() {
    if (!qrUrl) return
    setDlAll(true)
    for (let i = 1; i <= 12; i++) {
      const a = document.createElement('a')
      a.download = `fofitos-qr-${i}.png`
      a.href = qrUrl
      a.click()
      await new Promise(r => setTimeout(r, 250)) // small delay between downloads
    }
    setDlAll(false)
  }

  return (
    <div className="admin-content">
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1A1A2E' }}>QR Codes</div>
          <div style={{ fontSize: '0.8rem', color: '#9A98A8', marginTop: 4 }}>
            12 permanent QR codes — all encode <strong style={{ color: '#7C3AED' }}>https://www.fofitos.com</strong> forever.
            Print any of them — they will never change.
          </div>
        </div>
        <button
          onClick={downloadAll}
          disabled={!qrUrl || dlAll}
          style={{
            padding: '11px 22px', borderRadius: 12, border: 'none',
            background: dlAll ? '#9A98A8' : 'linear-gradient(135deg,#5B21B6,#7C3AED)',
            color: '#fff', fontFamily: 'Outfit, sans-serif',
            fontSize: '0.88rem', fontWeight: 700,
            cursor: (!qrUrl || dlAll) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: (!qrUrl || dlAll) ? 0.7 : 1,
            boxShadow: '0 4px 18px rgba(91,33,182,0.25)',
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {dlAll ? 'Downloading…' : 'Download All 12'}
        </button>
      </div>

      {/* Grid */}
      <style>{`
        .qr-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) { .qr-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px)  { .qr-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; } }
      `}</style>
      <div className="qr-grid">
        {Array.from({ length: 12 }, (_, i) => (
          <QRCard key={i + 1} num={i + 1} qrUrl={qrUrl} />
        ))}
      </div>
    </div>
  )
}
