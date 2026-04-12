import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Nav from './Nav'
import ReviewModal from './ReviewModal'
import Toast from './Toast'
import InlineCarousel from './InlineCarousel'
import logoImg from '../../assets/logo.png'

export default function HomePage() {
  const loc              = useLocation()
  const restoreCat        = loc.state?.restoreCat        || null
  const carouselProducts  = loc.state?.carouselProducts  || []
  const restoreProductId  = loc.state?.restoreProductId  || null

  const [cats, setCats]               = useState([])
  const [products, setProducts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [toast, setToast]             = useState('')
  const [selectedCat, setSelectedCat] = useState(restoreCat)

  useEffect(() => {
    Promise.all([
      sb.from('categories').select('*').order('sort_order'),
      sb.from('products').select('id, name, cat')
    ]).then(([{ data: catData }, { data: prodData }]) => {
      setCats(catData || [])
      setProducts(prodData || [])
      setLoading(false)
    })
  }, [])

  return (
    <>
      {/* ── Page content — blurs when a category is open ── */}
      <div style={{
        filter: selectedCat ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease',
        pointerEvents: selectedCat ? 'none' : 'auto',
        background: '#fff',
      }}>
        {/* ── Logo header ── */}
        <div style={{
          padding: '24px 20px 12px',
          background: '#fff',
        }}>
          <img
            src={logoImg}
            alt="FOFiTOS"
            style={{ height: 80, objectFit: 'contain', display: 'block' }}
          />
          <div style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1.5px',
            color: '#444', textTransform: 'uppercase', marginTop: 3,
          }}>
            Product of Doctor Farmer Foods
          </div>
        </div>

        <div className="home-cats">
          <div className="cats-label">Browse Categories</div>
          {loading ? (
            <div className="loading">Loading menu…</div>
          ) : (
            <div className="cat-grid-new">
              {cats.map((c, i) => (
                <div
                  key={c.id}
                  className="cat-card-new"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => setSelectedCat(c)}
                >
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Overlay: dims background, carousel floats on top ── */}
      {selectedCat && (
        <>
          {/* Dim backdrop — tap to close */}
          <div
            onClick={() => setSelectedCat(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.52)',
              zIndex: 100,
              animation: restoreCat ? 'none' : 'fdIn 0.28s ease',
            }}
          />

          {/* Floating close button */}
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

          {/* Bottom sheet carousel — only pass cached data when restoring the exact same category */}
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

      <style>{`
        @keyframes fdIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </>
  )
}
