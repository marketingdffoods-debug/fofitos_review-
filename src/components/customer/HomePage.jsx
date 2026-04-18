import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Footer from './Footer'
import logoImg from '../../assets/logo.png'
import manLogo from '../../assets/man-logo.png'

/* ── Single category card ── */
function CatCard({ c, index, onExpand }) {
  const [phase, setPhase] = useState('idle')
  const pressTimer = useRef(null)

  function startPress() {
    setPhase('pressing')
    pressTimer.current = setTimeout(() => setPhase('lifted'), 80)
  }

  function endPress() {
    clearTimeout(pressTimer.current)
    if (phase === 'pressing' || phase === 'lifted') {
      setPhase('lifted')
      setTimeout(() => { setPhase('idle'); onExpand(c) }, 160)
    }
  }

  function cancelPress() { clearTimeout(pressTimer.current); setPhase('idle') }

  const transform =
    phase === 'pressing' ? 'scale(0.96)'
    : phase === 'lifted'  ? 'scale(1.06) translateY(-8px)'
    : 'scale(1) translateY(0)'

  const shadow =
    phase === 'pressing' ? '0 2px 8px rgba(0,0,0,0.08)'
    : phase === 'lifted'  ? '0 20px 48px rgba(91,33,182,0.22), 0 8px 20px rgba(0,0,0,0.12)'
    : '0 2px 12px rgba(0,0,0,0.06)'

  return (
    <div
      className="cat-card-new"
      style={{
        animationDelay: `${index * 0.06}s`,
        transform,
        boxShadow: shadow,
        transition: phase === 'idle'
          ? 'transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease'
          : 'transform 0.14s cubic-bezier(.4,0,.2,1), box-shadow 0.14s ease',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
      }}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
    >
      {/* Lifted glow ring */}
      {phase === 'lifted' && (
        <div style={{
          position: 'absolute', inset: -3,
          borderRadius: 20,
          border: '2px solid rgba(124,58,237,0.35)',
          boxShadow: '0 0 0 4px rgba(124,58,237,0.10)',
          pointerEvents: 'none',
          zIndex: 10,
          animation: 'ringPulse 0.2s ease',
        }}/>
      )}

      <div className="cat-card-img-wrap">
        <img className="cat-card-img" src={c.img} alt={c.name} />
      </div>
      <div className="cat-card-body">
        <div className="cat-card-name-row">
          <span className="cat-card-name">{c.name}</span>
        </div>
        {c.description && (
          <div className="cat-card-desc">{c.description}</div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
export default function HomePage() {
  const nav = useNavigate()

  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.from('categories').select('*').order('sort_order')
      .then(({ data }) => {
        setCats(data || [])
        setLoading(false)
      })
  }, [])

  function openCategory(cat) {
    nav(`/category/${cat.id}`, { state: { cat } })
  }

  return (
    <>
      <style>{`
        @keyframes fdIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes ringPulse {
          from { opacity:0; transform:scale(0.9) }
          to   { opacity:1; transform:scale(1) }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#EDEAF8',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div className="home-header-wrap">
          <div style={{
            position: 'absolute', left: 24, top: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8,
            zIndex: 2,
          }}>
            <img src={logoImg} alt="FOFiTOS" style={{ height: 80, objectFit: 'contain', objectPosition: 'left', display: 'block' }} />
            <div style={{ fontSize: '0.68rem', fontWeight: 500, color: '#aaa', letterSpacing: '0.3px' }}>
              Product of Doctor Farmer Foods
            </div>
          </div>

          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          }}>
            <img src={manLogo} alt="mascot" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
        </div>

        {/* ── Category grid ── */}
        <div className="home-cats">
          <div className="cats-label">Browse Categories</div>
          {loading ? (
            <div className="loading">Loading menu…</div>
          ) : (
            <div className="cat-grid-new">
              {cats.map((c, i) => (
                <CatCard
                  key={c.id}
                  c={c}
                  index={i}
                  onExpand={openCategory}
                />
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}
