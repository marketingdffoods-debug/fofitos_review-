import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import zomatoImg from '../../assets/zomato.png'
import swiggyImg from '../../assets/swiggy.png'


const SLOT = () => window.innerWidth * 0.30

function VegBadge({ isVeg }) {
  const color = isVeg ? '#2D9E45' : '#8B1A1A'
  return (
    <div style={{
      width: 14, height: 14, border: `2px solid ${color}`, borderRadius: 3,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, background: 'rgba(255,255,255,0.15)', verticalAlign: 'middle',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
    </div>
  )
}

function starStr(r) {
  let s = ''
  for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : (i - 0.5 <= r ? '⭑' : '☆')
  return s
}

export default function InlineCarousel({ cat, skipAnimation = false, initialProducts = [], initialProductId = null }) {
  const findIdx = (prods) => {
    if (!initialProductId || !prods.length) return 0
    const i = prods.findIndex(p => p.id === initialProductId)
    return i >= 0 ? i : 0
  }

  const [products,  setProducts]  = useState(initialProducts)
  const [loading,   setLoading]   = useState(initialProducts.length === 0)
  const [activeIdx, setActiveIdx] = useState(() => findIdx(initialProducts))
  const [dragX,     setDragX]     = useState(0)
  const [snapping,  setSnapping]  = useState(false)
  const [nameKey,   setNameKey]   = useState(0)
  const [exiting,   setExiting]   = useState(false)

  const dragging  = useRef(false)
  const hasMoved  = useRef(false)
  const tapIdx    = useRef(null)
  const startX    = useRef(0)
  const startY    = useRef(0)
  const liveX     = useRef(0)
  const liveY     = useRef(0)
  const axisLock  = useRef(null)
  const snapTimer = useRef(null)
  const navTimer  = useRef(null)
  const wrapRef   = useRef(null)
  const moveRef   = useRef(null)
  const nav       = useNavigate()

  useEffect(() => {
    setActiveIdx(findIdx(initialProducts))
    setDragX(0); setExiting(false); setNameKey(0)
    if (initialProducts.length === 0) setLoading(true)
    sb.from('products')
      .select('id, name, img, price, tagline, rating, reviews, tags, is_veg')
      .eq('cat', cat.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setProducts(data || [])
        setActiveIdx(findIdx(data || []))
        setLoading(false)
      })
    return () => { clearTimeout(snapTimer.current); clearTimeout(navTimer.current) }
  }, [cat.id])

  moveRef.current = handleMove

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const h = e => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    el.addEventListener('touchmove', h, { passive: false })
    return () => el.removeEventListener('touchmove', h)
  }, [])

  const slotW = SLOT()

  function dragStart(x, y) {
    if (exiting) return
    dragging.current = true; hasMoved.current = false; axisLock.current = null; tapIdx.current = null
    startX.current = x; startY.current = y; liveX.current = 0; liveY.current = 0
    setSnapping(false); clearTimeout(snapTimer.current)
  }

  function handleMove(x, y) {
    if (!dragging.current) return
    const dx = x - startX.current, dy = y - startY.current
    if (!axisLock.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6))
      axisLock.current = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h'
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) hasMoved.current = true
    liveX.current = dx; liveY.current = dy
    if (axisLock.current === 'h') {
      let rx = dx
      if ((rx > 0 && activeIdx === 0) || (rx < 0 && activeIdx === products.length - 1)) rx *= 0.12
      rx = Math.max(-slotW * 1.1, Math.min(slotW * 1.1, rx))
      setDragX(rx)
    }
  }

  function dragEnd() {
    if (!dragging.current) return
    dragging.current = false
    if (axisLock.current === 'v' && liveY.current < -50) { goToDetail(); return }
    if (!hasMoved.current) {
      setDragX(0)
      const ti = tapIdx.current; tapIdx.current = null
      if (ti !== null) { if (ti === activeIdx) goToDetail(); else snapTo(ti) }
      return
    }
    if (axisLock.current === 'v') { setDragX(0); return }
    const dx = liveX.current, th = slotW * 0.22
    if      (dx < -th && activeIdx < products.length - 1) snapTo(activeIdx + 1)
    else if (dx >  th && activeIdx > 0)                   snapTo(activeIdx - 1)
    else bounce()
  }

  function bounce() {
    setSnapping(true); setDragX(0); liveX.current = 0
    snapTimer.current = setTimeout(() => setSnapping(false), 300)
  }

  function snapTo(i) {
    const target = -(i - activeIdx) * slotW
    setSnapping(true); setDragX(target); liveX.current = target
    snapTimer.current = setTimeout(() => {
      setSnapping(false); setActiveIdx(i); setNameKey(k => k + 1)
      setDragX(0); liveX.current = 0
    }, 300)
  }

  function goToDetail() {
    if (exiting || !products[activeIdx]) return
    setExiting(true)
    const p = products[activeIdx]
    const tStart = Date.now()
    sb.from('products').select('*').eq('id', p.id).single()
      .then(({ data: full }) => {
        const wait = Math.max(0, 700 - (Date.now() - tStart))
        navTimer.current = setTimeout(() =>
          nav(`/product/${p.id}`, { state: { fromCarousel: true, product: full || p, cat, products } }), wait)
      })
      .catch(() => {
        navTimer.current = setTimeout(() =>
          nav(`/product/${p.id}`, { state: { fromCarousel: true, product: p, cat, products } }), 700)
      })
  }

  /* ── image style ── */
  function imgStyle(i) {
    const offset    = i - activeIdx
    const visualPos = offset * slotW + dragX
    const dist      = Math.abs(visualPos) / slotW
    const d         = Math.min(dist, 1.0)
    const isActive  = dist < 0.15
    const size      = isActive ? 185 : 118
    const topOff    = isActive ? 7 : 41    // center of burger lands on card top edge
    const snap      = 'transform 0.3s cubic-bezier(0.22,1,0.36,1)'
    return {
      position: 'absolute',
      width: size, height: size,
      top: topOff, left: '50%',
      objectFit: 'contain',
      userSelect: 'none', WebkitUserSelect: 'none',
      pointerEvents: 'auto', cursor: 'pointer',
      transform: `translateX(calc(-50% + ${visualPos}px)) scale(${(isActive ? 1 : Math.max(0.65, 1 - 0.35 * d)).toFixed(3)})`,
      filter: isActive
        ? `drop-shadow(0 18px 36px rgba(0,0,0,0.38))`
        : `blur(${Math.min(2.5, 2.5 * d).toFixed(1)}px) drop-shadow(0 8px 18px rgba(0,0,0,0.2))`,
      opacity: isActive ? 1 : Math.max(0.6, 1 - 0.4 * d),
      zIndex: isActive ? 5 : 3,
      transition: snapping ? snap : 'none',
    }
  }

  const active = products[activeIdx]

  /* Layout constants */
  const CARD_H    = 230          // height of purple card
  const OVERFLOW  = 100          // outer wrapper extra height above card
  // card top is OVERFLOW px from outer-wrapper top
  // active burger (185px): center at card top → topOff = OVERFLOW - 185/2 = 7
  // side burger (118px):   center at card top → topOff = OVERFLOW - 118/2 = 41

  return (
    <>
      {/* ══ OUTER WRAPPER — full width, for image positioning ══ */}
      <div
        ref={wrapRef}
        style={{
          position: 'fixed', bottom: 28, left: 0, right: 0,
          height: CARD_H + OVERFLOW,      /* card height + image overflow above */
          zIndex: 101,
          touchAction: 'none',
          opacity: exiting ? 0 : 1,
          transition: exiting ? 'opacity 0.08s' : 'none',
          animation: exiting || skipAnimation ? 'none' : 'sheetUp 0.42s cubic-bezier(0.22,1,0.36,1) both',
        }}
        onTouchStart={e => dragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={dragEnd}
        onMouseDown={e => dragStart(e.clientX, e.clientY)}
        onMouseMove={e => { if (dragging.current) handleMove(e.clientX, e.clientY) }}
        onMouseUp={dragEnd}
        onMouseLeave={dragEnd}
      >
        {/* ── PURPLE CARD — full rounded corners, sits at bottom ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 14, right: 14,
          height: CARD_H,
          background: 'linear-gradient(145deg,#7B2CBF 0%,#4C1D95 100%)',
          borderRadius: 22,
          boxShadow: '0 -4px 40px rgba(0,0,0,0.28)',
          overflow: 'hidden',
          zIndex: 2,
        }}>
          {/* Glow blobs */}
          <div style={{position:'absolute',top:-30,right:-20,width:150,height:150,borderRadius:'50%',background:'rgba(167,139,250,0.22)',filter:'blur(36px)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-25,left:-15,width:110,height:110,borderRadius:'50%',background:'rgba(91,33,182,0.28)',filter:'blur(26px)',pointerEvents:'none'}}/>
        </div>

        {/* ── Product images — on top of card, overflow above ── */}
        {!loading && products.map((p, i) => {
          const dist = Math.abs((i - activeIdx) * slotW + dragX) / slotW
          if (dist > 1.6) return null
          return (
            <img key={p.id} src={p.img} alt={p.name} draggable={false}
              onPointerDown={() => { tapIdx.current = i }}
              style={imgStyle(i)}
            />
          )
        })}

        {/* ── Text content inside card ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 14, right: 14,
          height: CARD_H,
          padding: '96px 20px 22px',
          zIndex: 6,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
          pointerEvents: 'none',
        }}>
          {loading ? (
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:'0.85rem'}}>Loading…</div>
          ) : (
            <div key={nameKey} style={{animation:'nameFade 0.3s ease both'}}>
              {/* Name — clickable, triggers goToDetail */}
              <div
                onClick={() => goToDetail()}
                style={{fontSize:'clamp(1.15rem,4.8vw,1.5rem)',fontWeight:800,color:'#fff',lineHeight:1.3,marginBottom:4,
                  pointerEvents:'auto', cursor:'pointer'}}
              >
                {active && (() => {
                  const words = (active.name || '').split(' ')
                  const last  = words.pop()
                  return (
                    <>
                      {words.length > 0 && words.join(' ') + ' '}
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {last}
                        <span style={{display:'inline-flex',alignItems:'center',marginLeft:6,verticalAlign:'middle',position:'relative',top:'-1px'}}>
                          <VegBadge isVeg={active.is_veg !== false} />
                        </span>
                      </span>
                    </>
                  )
                })()}
              </div>
              {/* Tagline — also clickable */}
              {active?.tagline && (
                <div
                  onClick={() => goToDetail()}
                  style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.7)',lineHeight:1.4,marginBottom:8,
                    pointerEvents:'auto', cursor:'pointer'}}
                >
                  {active.tagline}
                </div>
              )}
              {/* Stars */}
              <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:9}}>
                <span style={{color:'#FBBF24',fontSize:'0.78rem',letterSpacing:1}}>{starStr(active?.rating||0)}</span>
                <span style={{fontWeight:700,color:'#fff',fontSize:'0.76rem'}}>{active?.rating}</span>
                <span style={{color:'rgba(255,255,255,0.5)',fontSize:'0.68rem'}}>({active?.reviews} reviews)</span>
              </div>
              {/* Tags */}
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {(active?.tags||[]).map(t=>(
                  <span key={t} style={{
                    fontSize:'0.58rem',fontWeight:800,letterSpacing:'1px',textTransform:'uppercase',
                    color:'rgba(255,255,255,0.95)',border:'1.5px solid rgba(255,255,255,0.45)',
                    borderRadius:50,padding:'3px 10px',background:'rgba(255,255,255,0.1)',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ TRANSITION OVERLAY — shared-element transition to detail page ══ */}
      {exiting && active && (
        <>
          {/* Background: dark overlay → page background */}
          <div style={{
            position:'fixed', inset:0, zIndex:199, pointerEvents:'none',
            animation:'transitionBg 0.68s ease forwards',
          }}/>

          {/* Burger rises from carousel position → detail page position */}
          <div style={{
            position:'fixed', top:80, left:'50%',
            zIndex:211, pointerEvents:'none',
            animation:'burgerRise 0.52s cubic-bezier(0.22,1,0.36,1) forwards',
          }}>
            <img src={active.img} alt={active.name} style={{
              width:185, height:185, objectFit:'contain', display:'block',
              filter:'drop-shadow(0 16px 36px rgba(0,0,0,0.35))',
            }}/>
          </div>

          {/* Purple card rises from carousel position → detail page position */}
          <div style={{
            position:'fixed', top:185, left:16, right:16,
            zIndex:209, pointerEvents:'none',
            animation:'cardRise 0.52s cubic-bezier(0.22,1,0.36,1) forwards',
            background:'linear-gradient(145deg,#7B2CBF 0%,#4C1D95 100%)',
            borderRadius:22, padding:'90px 20px 24px', overflow:'hidden',
          }}>
            <div style={{position:'absolute',top:-30,right:-20,width:130,height:130,borderRadius:'50%',background:'rgba(167,139,250,0.25)',filter:'blur(35px)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',bottom:-20,left:-10,width:100,height:100,borderRadius:'50%',background:'rgba(91,33,182,0.35)',filter:'blur(25px)',pointerEvents:'none'}}/>
            <div style={{position:'relative',zIndex:2}}>
              <div style={{fontSize:'clamp(1.25rem,5vw,1.6rem)',fontWeight:800,color:'#fff',lineHeight:1.2,marginBottom:6}}>{active.name}</div>
              {active.tagline && <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.7)',lineHeight:1.45,marginBottom:12}}>{active.tagline}</div>}
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:14}}>
                <span style={{color:'#FBBF24',fontSize:'0.82rem',letterSpacing:1}}>{starStr(active.rating||0)}</span>
                <span style={{fontWeight:700,color:'#fff',fontSize:'0.8rem'}}>{active.rating}</span>
                <span style={{color:'rgba(255,255,255,0.55)',fontSize:'0.73rem'}}>({active.reviews} reviews)</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {(active.tags||[]).map(t=>(
                  <span key={t} style={{fontSize:'0.62rem',fontWeight:800,letterSpacing:'1px',textTransform:'uppercase',color:'rgba(255,255,255,0.95)',border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:50,padding:'4px 12px',background:'rgba(255,255,255,0.1)'}}>{t}</span>
                ))}
              </div>
            </div>
          </div>

        </>
      )}

      <style>{`
        @keyframes sheetUp        { from { transform:translateY(100%); } to { transform:translateY(0); } }
        @keyframes nameFade       { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        @keyframes transitionBg   { 0% { background:rgba(0,0,0,0.52); } 100% { background:#F2EFF8; } }
        @keyframes burgerRise     { from { transform:translateX(-50%) translateY(calc(100vh - 431px)); } to { transform:translateX(-50%) translateY(0); } }
        @keyframes cardRise       { from { transform:translateY(calc(100vh - 443px)); } to { transform:translateY(0); } }
        @keyframes contentSlideUp { from { opacity:0; transform:translateY(80px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  )
}
