import { useState, useEffect } from 'react'
import QRCodeLib from 'qrcode'
import fofitosLogo from '../../assets/qr.png'

/*
  QR encodes https://www.fofitos.com directly.
  No redirect layer — scan goes straight to the website.
*/

const QR_URL = 'https://www.fofitos.com'

/* Compose QR + logo on canvas → returns data URL */
async function buildQR(url) {
  const SIZE = 420
  const qrDataUrl = await QRCodeLib.toDataURL(url, {
    width: SIZE, margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })

  const canvas  = document.createElement('canvas')
  canvas.width  = SIZE
  canvas.height = SIZE
  const ctx     = canvas.getContext('2d')

  const qrImg = new Image()
  await new Promise(r => { qrImg.onload = r; qrImg.src = qrDataUrl })
  ctx.drawImage(qrImg, 0, 0, SIZE, SIZE)

  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE * 0.14
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  const logo = new Image()
  await new Promise(res => { logo.onload = res; logo.src = fofitosLogo })
  const logoR = r - 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, logoR, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(logo, cx - logoR, cy - logoR, logoR * 2, logoR * 2)
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(91,33,182,0.2)'
  ctx.lineWidth   = 2
  ctx.stroke()
  ctx.restore()

  return canvas.toDataURL('image/png')
}

function QRCard({ label, filename }) {
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    buildQR(QR_URL).then(setQrUrl)
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(QR_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!qrUrl) return
    const a = document.createElement('a')
    a.download = filename
    a.href = qrUrl
    a.click()
  }

  return (
    <div style={{
      flex: 1, minWidth: 290,
      background: '#fff', borderRadius: 22,
      border: '1px solid #ECEDF2',
      boxShadow: '0 4px 28px rgba(91,33,182,0.09)',
      padding: '28px 24px 22px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>

      {/* Label */}
      <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1A1A2E' }}>{label}</div>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#2CB67D', background: 'rgba(44,182,125,0.10)', borderRadius: 50, padding: '3px 10px' }}>
          Permanent
        </span>
      </div>

      {/* QR display */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: -14, borderRadius: 20,
          background: 'linear-gradient(135deg,rgba(91,33,182,0.07),rgba(124,58,237,0.03))',
          border: '1.5px dashed rgba(91,33,182,0.20)',
        }}/>
        <div style={{
          background: '#fff', padding: 14, borderRadius: 14,
          position: 'relative', zIndex: 1,
          boxShadow: '0 2px 16px rgba(91,33,182,0.12)',
        }}>
          {qrUrl
            ? <img src={qrUrl} alt={label} style={{ width: 200, height: 200, display: 'block' }} />
            : (
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )
          }
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 800, fontSize: '0.68rem', letterSpacing: '2.5px', color: '#7C3AED', textTransform: 'uppercase' }}>
          FOFiTOS Kitchen
        </div>
      </div>

      {/* URL display */}
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9A98A8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          QR Points to
        </div>
        <div style={{ background: 'rgba(44,182,125,0.06)', border: '1px solid rgba(44,182,125,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 700 }}>{QR_URL}</span>
          <button onClick={handleCopy} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            {copied ? <>✓ Copied!</> : <>📋 Copy</>}
          </button>
        </div>
      </div>

      {/* Download */}
      <button
        onClick={handleDownload}
        disabled={!qrUrl}
        style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1.5px solid #ECEDF2', background: '#FAFAFA', color: '#5B21B6', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', fontWeight: 600, cursor: qrUrl ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: qrUrl ? 1 : 0.5 }}
        onMouseEnter={e => { if (qrUrl) { e.currentTarget.style.background='rgba(91,33,182,0.06)'; e.currentTarget.style.borderColor='#7C3AED' }}}
        onMouseLeave={e => { e.currentTarget.style.background='#FAFAFA'; e.currentTarget.style.borderColor='#ECEDF2' }}
      >
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Download QR with Logo (PNG)
      </button>

    </div>
  )
}

export default function QRPage() {
  return (
    <div className="admin-content">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1A1A2E' }}>QR Codes</div>
        <div style={{ fontSize: '0.8rem', color: '#9A98A8', marginTop: 4 }}>
          Scan goes directly to <strong style={{ color: '#2CB67D' }}>www.fofitos.com</strong> — permanent, no redirects.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <QRCard label="QR Code 1" filename="fofitos-qr-1.png" />
        <QRCard label="QR Code 2" filename="fofitos-qr-2.png" />
      </div>
    </div>
  )
}
