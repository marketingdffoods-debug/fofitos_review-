import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Footer from './Footer'
import Header from './Header'

const IMG = 140
const OVF = IMG / 2

/* Same floating-image card as CategoryPage */
function ProdCard({ p, index, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        paddingTop: OVF,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        animation: `prodCardIn 0.38s cubic-bezier(0.22,1,0.36,1) ${index * 0.04}s both`,
        transition: 'transform 0.13s cubic-bezier(.4,0,.2,1)',
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
      onTouchCancel={e => e.currentTarget.style.transform = ''}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
    >
      <img
        src={p.img}
        alt={p.name}
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
          filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.18))',
        }}
      />
      <div style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 18,
        paddingTop: OVF + 6,
        paddingBottom: 12,
        paddingLeft: 6,
        paddingRight: 6,
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(91,33,182,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: '1px solid rgba(255,255,255,0.65)',
        position: 'relative',
        zIndex: 1,
        minHeight: OVF + 52,
      }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: 700,
          color: '#3D2C7A', lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          padding: '0 4px',
        }}>
          {p.name}
        </div>
      </div>
    </div>
  )
}

export default function GroupPage() {
  const { groupName } = useParams()
  const nav = useNavigate()
  const decoded = decodeURIComponent(groupName)

  const [sections, setSections] = useState([])   // [{ cat, products }]
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    async function load() {
      /* 1 — fetch all sub-categories in this group */
      const { data: catData } = await sb
        .from('categories')
        .select('*')
        .eq('group_name', decoded)
        .order('sort_order')

      if (!catData?.length) { setLoading(false); return }

      /* 2 — fetch products for each sub-category */
      const result = []
      for (const cat of catData) {
        const { data: prods } = await sb
          .from('products')
          .select('id, name, img, tagline, sort_order')
          .eq('cat', cat.id)
          .order('sort_order', { ascending: true })
        result.push({ cat, products: prods || [] })
      }
      setSections(result)
      setLoading(false)
    }
    load()
  }, [decoded])

  return (
    <>
      <style>{`
        @keyframes prodCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pageSlideUp {
          from { transform: translateY(100vh); }
          to   { transform: translateY(0); }
        }
        .grp-wrap { padding: 16px 16px 40px; }
        .prod-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 12px;
          align-items: start;
        }
        @media (min-width: 900px) {
          .grp-wrap { max-width: 900px; margin: 0 auto; padding: 20px 48px 60px; }
          .prod-grid { grid-template-columns: repeat(4, 1fr); gap: 20px 16px; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#EDEAF8',
        animation: 'pageSlideUp 0.42s cubic-bezier(0.22,1,0.36,1) both',
        willChange: 'transform',
      }}>

        {/* ── Header ── */}
        <Header showBack />

        {/* ── Group title ── */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5B21B6', letterSpacing: '-0.3px' }}>
            {decoded}
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="grp-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9187B5', fontSize: '0.88rem' }}>
              Loading…
            </div>
          ) : sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9187B5', fontSize: '0.88rem' }}>
              No products found.
            </div>
          ) : (
            sections.map(({ cat, products }, si) => (
              <div key={cat.id} style={{ marginBottom: si < sections.length - 1 ? 40 : 0 }}>

                {/* ── Sub-category heading ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 18,
                }}>
                  <div style={{
                    fontSize: '1rem', fontWeight: 800,
                    color: '#5B21B6', whiteSpace: 'nowrap',
                  }}>
                    {cat.name}
                  </div>
                  <div style={{
                    flex: 1, height: 2,
                    background: 'linear-gradient(90deg, rgba(91,33,182,0.20) 0%, rgba(91,33,182,0.03) 100%)',
                    borderRadius: 2,
                  }}/>
                </div>

                {cat.description && (
                  <div style={{ fontSize: '0.74rem', color: '#9187B5', marginTop: -10, marginBottom: 14 }}>
                    {cat.description}
                  </div>
                )}

                {products.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: '#C0BBCC', padding: '12px 0' }}>
                    No products in this section yet.
                  </div>
                ) : (
                  <div className="prod-grid">
                    {products.map((p, i) => (
                      <ProdCard
                        key={p.id}
                        p={p}
                        index={i}
                        onClick={() => nav(`/product/${p.id}`, { state: { product: p, cat, products } })}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}
