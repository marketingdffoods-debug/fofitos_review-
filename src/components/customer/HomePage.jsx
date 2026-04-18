import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Footer from './Footer'
import logoImg from '../../assets/logo.png'
import manLogo from '../../assets/man-logo.png'

/* ── Floating image constants (same as CategoryPage) ── */
const IMG = 130
const OVF = IMG / 2

/* ── Single category card — floating image + glassy card ── */
function CatCard({ c, index, onExpand }) {
  const [phase, setPhase] = useState('idle')
  const pressTimer = useRef(null)
  const navTimer   = useRef(null)
  const touchUsed  = useRef(false)   // prevents duplicate mouse events after touch

  useEffect(() => () => {
    clearTimeout(pressTimer.current)
    clearTimeout(navTimer.current)
  }, [])

  function startPress(e) {
    if (e.type === 'touchstart') touchUsed.current = true
    else if (touchUsed.current) return   // skip mousedown fired after touch
    clearTimeout(pressTimer.current)
    setPhase('pressing')
    pressTimer.current = setTimeout(() => setPhase('lifted'), 80)
  }
  function endPress(e) {
    if (e.type === 'mouseup' && touchUsed.current) { touchUsed.current = false; return }
    if (e.type === 'touchend') { e.preventDefault(); touchUsed.current = false }
    clearTimeout(pressTimer.current)
    if (phase === 'pressing' || phase === 'lifted') {
      setPhase('lifted')
      clearTimeout(navTimer.current)
      navTimer.current = setTimeout(() => { setPhase('idle'); onExpand(c) }, 160)
    }
  }
  function cancelPress() {
    clearTimeout(pressTimer.current)
    clearTimeout(navTimer.current)
    setPhase('idle')
  }

  const scale =
    phase === 'pressing' ? 'scale(0.95)'
    : phase === 'lifted'  ? 'scale(1.05) translateY(-6px)'
    : 'scale(1)'

  return (
    /* Entry animation wrapper — only handles fade-in, never re-animates */
    <div style={{
      animation: `catFadeIn 0.4s cubic-bezier(.22,1,.36,1) ${index * 0.06}s both`,
    }}>
    {/* Press/lift interaction wrapper */}
    <div
      style={{
        position: 'relative',
        paddingTop: OVF,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transform: scale,
        transition: phase === 'idle'
          ? 'transform 0.3s cubic-bezier(.4,0,.2,1)'
          : 'transform 0.14s cubic-bezier(.4,0,.2,1)',
        willChange: 'transform',
      }}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
    >
      {/* Floating category image */}
      <img
        src={c.img}
        alt={c.name}
        draggable={false}
        style={{
          position: 'absolute',
          top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: IMG, height: IMG,
          objectFit: 'contain',
          display: 'block',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.18))',
        }}
      />

      {/* Glassy card */}
      <div style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 18,
        paddingTop: OVF + 8,
        paddingBottom: 14,
        paddingLeft: 8,
        paddingRight: 8,
        textAlign: 'center',
        boxShadow: phase === 'lifted'
          ? '0 20px 48px rgba(91,33,182,0.22), inset 0 1px 0 rgba(255,255,255,0.8)'
          : '0 4px 20px rgba(91,33,182,0.09), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: phase === 'lifted'
          ? '1.5px solid rgba(124,58,237,0.35)'
          : '1px solid rgba(255,255,255,0.65)',
        position: 'relative',
        zIndex: 1,
        minHeight: OVF + 60,
        transition: 'box-shadow 0.2s, border 0.2s',
      }}>
        <div style={{
          fontSize: '0.85rem', fontWeight: 700,
          color: '#3D2C7A', lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          padding: '0 4px',
        }}>
          {c.name}
        </div>
        {c.description && (
          <div style={{
            fontSize: '0.63rem', color: '#9187B5',
            marginTop: 4, lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {c.description}
          </div>
        )}
      </div>
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
        @keyframes catFadeIn {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
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
        <div className="home-cats" style={{ paddingTop: OVF + 16 }}>
          <div className="cats-label">Browse Categories</div>
          {loading ? (
            <div className="loading">Loading menu…</div>
          ) : (
            <div className="cat-grid-new" style={{ alignItems: 'start' }}>
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
