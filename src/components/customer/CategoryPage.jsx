import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Footer from './Footer'
import logoImg from '../../assets/logo.png'
import manLogo from '../../assets/man-logo.png'

/* Convert any YouTube watch URL → embed URL */
function ytEmbed(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}?rel=0` : url
    }
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${u.pathname}?rel=0`
    }
  } catch {}
  return url
}

function isYouTube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

/* ── Single product card — image floats half above card, half inside ── */
const IMG = 140  // image diameter in px
const OVF = IMG / 2  // how many px the image extends above the white card

function ProdCard({ p, index, onClick }) {
  return (
    /* Outer transparent wrapper — provides the top space for the image overflow */
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        paddingTop: OVF,          // transparent top half-image zone
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
      {/* ── Floating product image (top half transparent, bottom half over card) ── */}
      <img
        src={p.img}
        alt={p.name}
        draggable={false}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: IMG,
          height: IMG,
          objectFit: 'contain',
          display: 'block',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.18))',
        }}
      />

      {/* ── Glassy card — just name, image overlaps the top ── */}
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
          color: '#3D2C7A',
          lineHeight: 1.35,
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

export default function CategoryPage() {
  const { catId } = useParams()
  const loc = useLocation()
  const nav = useNavigate()

  const [cat,      setCat]      = useState(loc.state?.cat || null)
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)

    // Fetch category data (in case video_url or description changed)
    sb.from('categories').select('*').eq('id', catId).single()
      .then(({ data }) => { if (data) setCat(data) })

    // Fetch products
    sb.from('products')
      .select('id, name, img, price, tagline, rating, reviews, tags, is_veg, sort_order')
      .eq('cat', catId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const prods = data || []
        setProducts(prods)
        setLoading(false)
        prods.forEach(p => { if (p.img) { const i = new Image(); i.src = p.img } })
      })
  }, [catId])

  return (
    <>
      <style>{`
        @keyframes prodCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes catFdIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pageSlideUp {
          from { transform: translateY(100vh); }
          to   { transform: translateY(0); }
        }

        /* ── Video wrapper ── */
        .cat-video-wrap {
          margin: 14px 16px 0;
          border-radius: 18px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 16/9;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        }
        @media (min-width: 900px) {
          .cat-video-wrap {
            max-width: 680px;
            margin: 18px auto 0;
          }
        }

        /* ── Product grid responsive layout ── */
        .prod-grid-wrap {
          padding: 16px 16px 130px;
        }
        .prod-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 12px;
          align-items: start;
        }
        @media (min-width: 900px) {
          .prod-grid-wrap {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px 48px 130px;
          }
          .prod-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px 16px;
          }
        }
      `}</style>

      {/* ── PAGE ── */}
      <div style={{
        minHeight: '100vh',
        background: '#EDEAF8',
        animation: 'pageSlideUp 0.42s cubic-bezier(0.22,1,0.36,1) both',
        willChange: 'transform',
      }}>

        {/* ── Header ── */}
        <div className="home-header-wrap">
          {/* Back button */}
          <button
            onClick={() => nav('/')}
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid rgba(91,33,182,0.15)',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '1.1rem', color: '#5B21B6',
              zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              pointerEvents: 'auto',
            }}
          >←</button>

          {/* Logo — left of center */}
          <div style={{
            position: 'absolute', left: 64, top: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
            zIndex: 2,
          }}>
            <img src={logoImg} alt="FOFiTOS" style={{ height: 70, objectFit: 'contain', objectPosition: 'left', display: 'block' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 500, color: '#aaa', letterSpacing: '0.3px' }}>
              Product of Doctor Farmer Foods
            </div>
          </div>

          {/* Mascot — right edge */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 220,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          }}>
            <img src={manLogo} alt="mascot" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
        </div>

        {/* ── Video section — right below header ── */}
        {cat?.video_url && (
          <div className="cat-video-wrap">
            {isYouTube(cat.video_url) ? (
              <iframe
                src={ytEmbed(cat.video_url)}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={cat.name}
              />
            ) : (
              <video
                src={cat.video_url}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
        )}

        {/* ── Category name + desc ── */}
        <div style={{ padding: '12px 20px 4px' }}>
          <div style={{
            fontSize: '1.25rem', fontWeight: 800, color: '#5B21B6',
            letterSpacing: '-0.3px', lineHeight: 1.2,
          }}>
            {cat?.name || ''}
          </div>
          {cat?.description && (
            <div style={{ fontSize: '0.74rem', color: '#9187B5', marginTop: 3 }}>
              {cat.description}
            </div>
          )}
        </div>

        {/* ── Product grid ── */}
        <div className="prod-grid-wrap" style={{ paddingBottom: 32 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9187B5', fontSize: '0.88rem' }}>
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9187B5', fontSize: '0.88rem' }}>
              No products yet.
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

        <Footer />
      </div>

    </>
  )
}
