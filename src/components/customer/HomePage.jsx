import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import ReviewModal from './ReviewModal'
import Toast from './Toast'
import InlineCarousel from './InlineCarousel'
import logoImg from '../../assets/logo.png'
import manLogo from '../../assets/man-logo.png'

/* ── Single card with Tap → Lift → Expand ── */
function CatCard({ c, index, onExpand }) {
  const [phase, setPhase] = useState('idle') // idle → pressing → lifted → idle
  const pressTimer = useRef(null)
  const cardRef = useRef(null)

  function startPress() {
    setPhase('pressing')
    pressTimer.current = setTimeout(() => setPhase('lifted'), 80)
  }

  function endPress() {
    clearTimeout(pressTimer.current)
    if (phase === 'pressing' || phase === 'lifted') {
      setPhase('lifted')
      // small delay so lift animation is visible before expand
      setTimeout(() => {
        setPhase('idle')
        onExpand(c)
      }, 160)
    }
  }

  function cancelPress() {
    clearTimeout(pressTimer.current)
    setPhase('idle')
  }

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
      ref={cardRef}
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
      /* Touch */
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      /* Mouse */
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

export default function HomePage() {
  const loc             = useLocation()
  const restoreCat      = loc.state?.restoreCat       || null
  const carouselProducts = loc.state?.carouselProducts || []
  const restoreProductId = loc.state?.restoreProductId || null

  const [cats,        setCats]        = useState([])
  const [products,    setProducts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(false)
  const [toast,       setToast]       = useState('')
  const [selectedCat, setSelectedCat] = useState(restoreCat)

  useEffect(() => {
    Promise.all([
      sb.from('categories').select('*').order('sort_order'),
      sb.from('products').select('id, name, cat, img'),
    ]).then(([{ data: catData }, { data: prodData }]) => {
      setCats(catData || [])
      setProducts(prodData || [])
      setLoading(false)
      ;(prodData || []).forEach(p => { if (p.img) { const i = new Image(); i.src = p.img } })
    })
  }, [])

  return (
    <>
      <style>{`
        @keyframes fdIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes ringPulse {
          from { opacity:0; transform:scale(0.9) }
          to   { opacity:1; transform:scale(1) }
        }
      `}</style>

      {/* ── Page content ── */}
      <div style={{
        filter: selectedCat ? 'blur(5px)' : 'none',
        transition: 'filter 0.3s ease',
        pointerEvents: selectedCat ? 'none' : 'auto',
        minHeight: '100vh',
        background: '#EDEAF8',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div className="home-header-wrap">
          {/* Left: logo + taglines */}
          <div style={{ paddingBottom: 22, zIndex: 2, flex: 1 }}>
            <img src={logoImg} alt="FOFiTOS" style={{ height: 52, objectFit: 'contain', display: 'block' }} />
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '2.5px', color: '#7C3AED', textTransform: 'uppercase', marginTop: 6 }}>
              Tasty &nbsp;-&nbsp; Healthy &nbsp;-&nbsp; Everyday
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 500, color: '#999', marginTop: 5 }}>
              Product of Doctor Farmer Foods
            </div>
          </div>
          {/* Right: mascot — slightly overflows top for effect */}
          <img
            src={manLogo}
            alt="mascot"
            style={{ height: 140, objectFit: 'contain', display: 'block', flexShrink: 0, alignSelf: 'flex-end', marginBottom: 0 }}
          />
        </div>

        {/* ── Category Grid ── */}
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
                  onExpand={setSelectedCat}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded overlay ── */}
      {selectedCat && (
        <>
          <div
            onClick={() => setSelectedCat(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.52)',
              zIndex: 100,
              animation: restoreCat ? 'none' : 'fdIn 0.25s ease',
            }}
          />
          <button
            onClick={() => setSelectedCat(null)}
            style={{
              position: 'fixed', top: 18, right: 18,
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '0.82rem', color: '#fff',
              zIndex: 102,
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            }}
          >✕</button>

          {(() => {
            const isRestore = !!restoreCat && restoreCat.id === selectedCat.id
            return (
              <InlineCarousel
                cat={selectedCat}
                skipAnimation={isRestore}
                initialProducts={isRestore ? carouselProducts : []}
                initialProductId={isRestore ? restoreProductId : null}
              />
            )
          })()}
        </>
      )}

      {modal && (
        <ReviewModal
          products={products}
          onClose={() => setModal(false)}
          onPosted={() => setToast('✦ Review posted!')}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </>
  )
}
