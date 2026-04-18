import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Nav from './Nav'
import ReviewModal from './ReviewModal'
import Toast from './Toast'
import Footer from './Footer'
import zomatoImg from '../../assets/zomato.png'
import swiggyImg from '../../assets/swiggy.png'

function VegBadge({ isVeg }) {
  const color = isVeg ? '#2D9E45' : '#8B1A1A'
  return (
    <div style={{
      width: 16, height: 16, border: `2.5px solid ${color}`, borderRadius: 3,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, background: 'rgba(255,255,255,0.15)', verticalAlign: 'middle',
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
    </div>
  )
}

function starStr(r) {
  let s = ''
  for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : (i - 0.5 <= r ? '⭑' : '☆')
  return s
}
function avatarColor(name) {
  const colors = ['#7B2CBF','#E05252','#4A90D9','#E09A2C','#2CB67D']
  let h = 0; for (let c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

/* ── Apple Watch-style animated activity rings ── */
function ActivityRings({ pro, fat, carb, fibre, cal, revealed = false }) {
  const SIZE = 180
  const C    = SIZE / 2   // 90
  const SW   = 13         // stroke width

  const total = Math.max((pro||0)+(fat||0)+(carb||0)+(fibre||0), 1)

  // Three concentric rings: outer → inner
  const rings = [
    { r:72, color:'#FF2D55', label:'Carbs',   val:carb  || 0 },
    { r:55, color:'#AAFF00', label:'Protein', val:pro   || 0 },
    { r:38, color:'#00D8FF', label:'Fat',     val:fat   || 0 },
  ]

  // End-point of arc + rotation angle for the arrow tip
  function endPt(r, pct) {
    const a = -Math.PI/2 + pct * 2 * Math.PI
    return { x: C + r*Math.cos(a), y: C + r*Math.sin(a), rot: pct*360 }
  }

  const legend = [
    { l:'Carbs',   pct:Math.round((carb  ||0)/total*100), c:'#FF2D55' },
    { l:'Protein', pct:Math.round((pro   ||0)/total*100), c:'#AAFF00' },
    { l:'Fat',     pct:Math.round((fat   ||0)/total*100), c:'#00D8FF' },
    { l:'Fibre',   pct:Math.round((fibre ||0)/total*100), c:'#C8BEA8' },
  ]

  return (
    <div style={{display:'flex', alignItems:'center', gap:16}}>
      {/* ── Rings SVG ── */}
      <div style={{flexShrink:0, borderRadius:'50%', boxShadow:'0 8px 32px rgba(0,0,0,0.38)'}}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{display:'block'}}>
          {/* Deep-dark background */}
          <circle cx={C} cy={C} r={C} fill="#10081E"/>

          {rings.map((ring, i) => {
            const pct  = ring.val / total
            const circ = 2 * Math.PI * ring.r
            const len  = revealed ? Math.max(pct * circ - SW*0.55, 0) : 0
            const ep   = endPt(ring.r, pct)

            return (
              <g key={ring.label}>
                {/* Dim track */}
                <circle
                  cx={C} cy={C} r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={SW}
                  strokeOpacity={0.18}
                />
                {/* Animated filled arc — starts from 12 o'clock */}
                <circle
                  cx={C} cy={C} r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={SW}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${C} ${C})`}
                  style={{
                    strokeDasharray: `${len} ${circ}`,
                    transition: revealed
                      ? `stroke-dasharray 1.0s ${i*0.22}s cubic-bezier(0.22,1,0.36,1)`
                      : 'none',
                    filter: revealed ? `drop-shadow(0 0 5px ${ring.color}90)` : 'none',
                  }}
                />
                {/* Arrow chevron at the tip of each ring */}
                {revealed && pct > 0.04 && (
                  <g
                    transform={`translate(${ep.x},${ep.y}) rotate(${ep.rot})`}
                    style={{opacity:0, animation:`fadeIn 0.22s ${i*0.22+1.05}s ease forwards`}}
                  >
                    <path
                      d="M-5.5,-4 L0.5,0 L-5.5,4"
                      fill="none"
                      stroke={ring.color}
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
              </g>
            )
          })}

          {/* Center: calorie value */}
          <text x={C} y={C-4} textAnchor="middle"
            fill="#fff" fontSize="21" fontWeight="800" fontFamily="Outfit,sans-serif"
          >{cal}</text>
          <text x={C} y={C+14} textAnchor="middle"
            fill="rgba(255,255,255,0.35)" fontSize="9" letterSpacing="2.5"
            fontFamily="Outfit,sans-serif"
          >KCAL</text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{flex:1, display:'flex', flexDirection:'column', gap:10}}>
        {legend.map(m => (
          <div key={m.l} style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span style={{display:'flex', alignItems:'center', gap:7, fontSize:'0.78rem', color:'#555'}}>
              <span style={{width:8, height:8, borderRadius:'50%', background:m.c, display:'inline-block', flexShrink:0}}/>
              {m.l}
            </span>
            <span style={{fontSize:'0.78rem', fontWeight:700, color:'#1a1a2e'}}>{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Overall Score card ── */
function OverallScore({ rating, reviews }) {
  const target = Math.round(((rating || 0) / 5) * 100)
  const [count, setCount]     = useState(0)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!entered) return
    let cur = 0
    const step = target / 50
    const id = setInterval(() => {
      cur += step
      if (cur >= target) { setCount(target); clearInterval(id) }
      else setCount(Math.floor(cur))
    }, 20)
    return () => clearInterval(id)
  }, [entered, target])

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
      borderRadius:14, padding:'14px 16px', marginTop:12,
      animation:'scoreCardIn 0.5s ease-out both',
    }}>
      {/* Top-right blob */}
      <div style={{
        position:'absolute', top:-22, right:-22,
        width:80, height:80, borderRadius:'50%',
        background:'rgba(167,139,250,0.22)',
        animation:'blobFloat 3s ease-in-out infinite',
        pointerEvents:'none',
      }}/>
      {/* Smaller inner blob */}
      <div style={{
        position:'absolute', top:-6, right:-6,
        width:38, height:38, borderRadius:'50%',
        background:'rgba(196,181,253,0.15)',
        animation:'blobFloat 3s 0.6s ease-in-out infinite',
        pointerEvents:'none',
      }}/>

      {/* Title */}
      <div style={{fontSize:'0.52rem',fontWeight:800,letterSpacing:'2.5px',color:'rgba(196,181,253,0.65)',textTransform:'uppercase',marginBottom:7,position:'relative',zIndex:1}}>
        Overall Score
      </div>

      {/* Score */}
      <div style={{display:'flex',alignItems:'baseline',gap:4,position:'relative',zIndex:1}}>
        <span style={{fontSize:'2.1rem',fontWeight:800,color:'#fff',lineHeight:1}}>{count}</span>
        <span style={{fontSize:'0.95rem',fontWeight:600,color:'rgba(196,181,253,0.55)'}}>/100</span>
      </div>

      {/* Secondary line + shimmer */}
      <div style={{position:'relative',overflow:'hidden',marginTop:6,zIndex:1}}>
        <div style={{fontSize:'0.62rem',color:'rgba(196,181,253,0.55)',lineHeight:1.4}}>
          Based on {reviews || 0} customer reviews
        </div>
        <div style={{
          position:'absolute',inset:0,
          background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.35) 50%,transparent 70%)',
          animation:'shimmerOnce 1s 0.6s ease-out forwards',
          transform:'translateX(-150%)',
          pointerEvents:'none',
        }}/>
      </div>
    </div>
  )
}

/* ── Macro icon SVGs ── */
function FlameIcon({ color }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} width="32" height="32">
      <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32C8.87 6.4 7.85 10.07 9.07 13.22c.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12-.08-.05-.12-.1-.16-.17C6.87 12.33 6.69 10.28 7.45 8.64 5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73C7.08 19.43 8.95 20.67 10.96 20.92c2.14.27 4.43-.12 6.07-1.6C18.86 17.66 19.5 15 18.56 12.72l-.13-.26c-.21-.44-.77-1.26-.77-1.26z"/>
    </svg>
  )
}
function DumbbellIcon({ color }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} width="34" height="34">
      <rect x="1"    y="7.5" width="4"   height="9" rx="1.5"/>
      <rect x="4"    y="9.5" width="2.5" height="5"/>
      <rect x="6.5"  y="11"  width="11"  height="2"/>
      <rect x="17.5" y="9.5" width="2.5" height="5"/>
      <rect x="19"   y="7.5" width="4"   height="9" rx="1.5"/>
    </svg>
  )
}
function WheatIcon({ color }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} width="32" height="32">
      <path d="M8 20 Q11 13 14 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <ellipse cx="10.5" cy="17.5" rx="2.4" ry="1.3" transform="rotate(-55 10.5 17.5)"/>
      <ellipse cx="8.2"  cy="16.5" rx="2.4" ry="1.3" transform="rotate(-125 8.2 16.5)"/>
      <ellipse cx="11.2" cy="13.5" rx="2.4" ry="1.3" transform="rotate(-55 11.2 13.5)"/>
      <ellipse cx="9"    cy="12.5" rx="2.4" ry="1.3" transform="rotate(-125 9 12.5)"/>
      <ellipse cx="12"   cy="9.5"  rx="2.4" ry="1.3" transform="rotate(-55 12 9.5)"/>
      <ellipse cx="9.8"  cy="8.5"  rx="2.4" ry="1.3" transform="rotate(-125 9.8 8.5)"/>
      <ellipse cx="13"   cy="6"    rx="2"   ry="1.1" transform="rotate(-90 13 6)"/>
    </svg>
  )
}

export default function DetailPage() {
  const { productId } = useParams()
  const nav           = useNavigate()
  const loc           = useLocation()

  /* ── Redirect to home on direct load / reload (no nav state) ── */
  useEffect(() => {
    if (!loc.state?.product) {
      nav('/', { replace: true })
    }
  }, [])

  /* ── transition context ── */
  const fromCarousel    = !!loc.state?.fromCarousel
  const initialProd     = loc.state?.product  || null
  const savedCat        = loc.state?.cat      || null
  const savedProducts   = loc.state?.products || []

  const [product,     setProduct]     = useState(initialProd)
  const [allProducts, setAllProducts] = useState([])
  const [reviews,     setReviews]     = useState([])
  const [loading,     setLoading]     = useState(!initialProd)
  const [modal,       setModal]       = useState(false)
  const [toast,       setToast]       = useState('')
  const [macrosRevealed, setMacrosRevealed] = useState(false)
  const [chartIn,        setChartIn]        = useState(false)
  const [imgLoaded,      setImgLoaded]      = useState(!!fromCarousel) // skip fade when from carousel (already preloaded)

  const scrollRef   = useRef(null)
  const leavingRef  = useRef(false)

  /* ── 5-second macro reveal ── */
  /* ── scroll to top whenever the product changes ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [productId])

  useEffect(() => {
    const t = setTimeout(() => setMacrosRevealed(true), 3000)
    return () => clearTimeout(t)
  }, [])

  /* ── chart draw-in after short delay ── */
  useEffect(() => {
    const t = setTimeout(() => setChartIn(true), 350)
    return () => clearTimeout(t)
  }, [])

  const fetchReviews = useCallback(async () => {
    const { data } = await sb.from('reviews').select('*')
      .eq('product_id', productId)
      .eq('visible', true)
      .order('created_at',{ascending:false})
    setReviews(data||[])
  }, [productId])

  useEffect(() => {
    if (!initialProd) setLoading(true)
    Promise.all([
      sb.from('products').select('*').eq('id', productId).single(),
      sb.from('products').select('id, name'),
    ]).then(([{data:prod},{data:allProds}]) => {
      setProduct(prod)
      setAllProducts(allProds||[])
      setLoading(false)
    })
    fetchReviews()
  }, [productId, fetchReviews])

  /* ── Next product navigation ── */
  const navList = savedProducts.length ? savedProducts : allProducts
  const currentIdx = navList.findIndex(x => String(x.id) === String(productId))
  const hasNext = currentIdx !== -1 && currentIdx < navList.length - 1
  const hasPrev = currentIdx > 0

  async function goToProduct(offset) {
    if (leavingRef.current) return
    const next = navList[currentIdx + offset]
    if (!next) return
    const { data: nextProd } = await sb.from('products').select('*').eq('id', next.id).single()
    if (!nextProd) return
    nav(`/product/${next.id}`, {
      state: { product: nextProd, cat: savedCat, products: savedProducts }
    })
  }

  /* helpers for conditional animation — instant when from carousel */
  const heroAnim    = fromCarousel ? 'none' : undefined
  const contentAnim = (base, delay) =>
    fromCarousel
      ? 'none'
      : `fadeUp 0.4s ${delay}s ease both`

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#aaa',fontSize:'0.9rem'}}>Loading…</div>
  if (!product) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#aaa',fontSize:'0.9rem'}}>Not found.</div>

  const p = product
  const allRevs = [...reviews,...(Array.isArray(p.revs)?p.revs:[])]

  return (
    <>
      <style>{`
        @keyframes imgFloat {
          from { transform: translateY(20px) scale(0.9); opacity: 0.6; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes cardUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dp-scroll::-webkit-scrollbar { display:none; }
        .dp-mobile-layout { display:block; }
        .dp-desktop-layout { display:none; }
        @media (min-width:900px) {
          .dp-mobile-layout { display:none !important; }
          .dp-desktop-layout { display:block; zoom:0.8; }
        }
        .dp-right-scroll::-webkit-scrollbar { display:none; }
        .dp-right-scroll { -ms-overflow-style:none; scrollbar-width:none; }
        @keyframes scoreCardIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat    { 0%,100% { transform:scale(1) translateY(0); } 50% { transform:scale(1.08) translateY(-4px); } }
        @keyframes shimmerOnce  { from { transform:translateX(-150%); } to { transform:translateX(250%); } }
        @keyframes macroShine {
          0%   { transform: translateX(-160%) skewX(-15deg); }
          55%, 100% { transform: translateX(320%) skewX(-15deg); }
        }
        @keyframes iconPulse {
          0%, 100% { filter: drop-shadow(0 0 4px currentColor); transform: scale(1); }
          50%       { filter: drop-shadow(0 0 12px currentColor); transform: scale(1.08); }
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* ── Back button ── */}
      <button
        onClick={() => nav(-1)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 999,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#4C1D95" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="dp-scroll dp-mobile-layout"
        style={{
          overflowY: 'auto',
          height:'100dvh',
          background:'#F2EFF8',
          paddingBottom: 40,
        }}
      >
        {/* ══ HERO CARD ══ */}
        <div style={{ padding: '0 16px', marginTop: 16 }}>
          <div style={{
            display: 'flex', justifyContent: 'center',
            marginBottom: -80, position: 'relative', zIndex: 10,
            animation: heroAnim ?? 'imgFloat 0.55s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <img src={p.img} alt={p.name}
              onLoad={() => setImgLoaded(true)}
              style={{
                width: 185, height: 185, objectFit: 'contain',
                filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.35))',
                display: 'block',
                willChange: 'transform',
                opacity: imgLoaded ? 1 : 0,
                transition: imgLoaded ? 'opacity 0.28s ease' : 'none',
              }}
            />
          </div>

          <div style={{
            background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
            borderRadius: 22, padding:'90px 20px 24px',
            position:'relative', overflow:'hidden',
            animation: heroAnim ?? 'cardUp 0.45s 0.05s cubic-bezier(0.22,1,0.36,1) both',
            willChange: 'transform',
          }}>
            <div style={{position:'absolute',top:-28,right:-28,width:120,height:120,borderRadius:'50%',background:'rgba(196,181,253,0.18)',pointerEvents:'none',animation:'blobFloat 3s ease-in-out infinite'}}/>
            <div style={{position:'absolute',bottom:-20,left:-10,width:100,height:100,borderRadius:'50%',background:'rgba(91,33,182,0.35)',filter:'blur(25px)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)',animation:'shimmerOnce 1.4s 0.2s ease-out forwards',transform:'translateX(-150%)',pointerEvents:'none',zIndex:1}}/>

            <div style={{position:'relative',zIndex:2}}>
              <div style={{fontSize:'clamp(1.25rem,5vw,1.6rem)',fontWeight:800,color:'#fff',lineHeight:1.3,marginBottom:6}}>
                {(() => {
                  const words = (p.name || '').split(' ')
                  const last  = words.pop()
                  return (
                    <>
                      {words.length > 0 && words.join(' ') + ' '}
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {last}
                        <span style={{display:'inline-flex',alignItems:'center',marginLeft:7,verticalAlign:'middle',position:'relative',top:'-1px'}}>
                          <VegBadge isVeg={p.is_veg !== false} />
                        </span>
                      </span>
                    </>
                  )
                })()}
              </div>
              {p.tagline && <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.7)',lineHeight:1.45,marginBottom:12}}>{p.tagline}</div>}
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:14}}>
                <span style={{color:'#FBBF24',fontSize:'0.82rem',letterSpacing:1}}>{starStr(p.rating||0)}</span>
                <span style={{fontWeight:700,color:'#fff',fontSize:'0.8rem'}}>{p.rating}</span>
                <span style={{color:'rgba(255,255,255,0.55)',fontSize:'0.73rem'}}>({p.reviews} reviews)</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {(p.tags||[]).map(t=>(
                  <span key={t} style={{fontSize:'0.62rem',fontWeight:800,letterSpacing:'1px',textTransform:'uppercase',color:'rgba(255,255,255,0.95)',border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:50,padding:'4px 12px',background:'rgba(255,255,255,0.1)'}}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ ORDER BUTTONS + REVIEW — single row ══ */}
        <div style={{display:'flex',gap:10,padding:'14px 16px 0',animation:contentAnim('fadeUp',0.2)}}>
          {/* Zomato — logo only */}
          <button style={{width:52,height:46,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',border:'1.5px solid #FFDAD8',borderRadius:50,padding:'8px',cursor:'pointer',boxShadow:'0 2px 12px rgba(226,36,26,0.1)'}}>
            <img src={zomatoImg} alt="Zomato" style={{height:24,objectFit:'contain'}}/>
          </button>
          {/* Swiggy — logo only */}
          <button style={{width:52,height:46,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',border:'1.5px solid #FFE0C8',borderRadius:50,padding:'8px',cursor:'pointer',boxShadow:'0 2px 12px rgba(252,128,25,0.1)'}}>
            <img src={swiggyImg} alt="Swiggy" style={{height:24,objectFit:'contain'}}/>
          </button>
          {/* Write a Review — fills remaining space */}
          <button onClick={()=>setModal(true)} style={{flex:1,height:46,display:'flex',alignItems:'center',justifyContent:'center',background:'#7B2CBF',color:'#fff',border:'none',borderRadius:50,fontSize:'0.82rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 18px rgba(123,44,191,0.32)'}}>
            Write a Review
          </button>
        </div>

        {/* ══ MACRO ROW ══ */}
        <div style={{display:'flex',gap:8,padding:'14px 16px 0',animation:contentAnim('fadeUp',0.28)}}>
          {[
            {val:p.cal,  unit:'kcal', label:'CALORIES', line:'#F59E0B', accent:'#FFF7E6', color:'#F59E0B', icon:<FlameIcon    color="#F59E0B"/>, delay:0},
            {val:p.pro,  unit:'g',    label:'PROTEIN',  line:'#2CB67D', accent:'#EDFAF4', color:'#2CB67D', icon:<DumbbellIcon color="#2CB67D"/>, delay:90},
            {val:p.carb, unit:'g',    label:'CARBS',    line:'#4A90D9', accent:'#EEF4FF', color:'#4A90D9', icon:<WheatIcon    color="#4A90D9"/>, delay:180},
          ].map(m=>(
            <div key={m.label} style={{
              flex:1, position:'relative', overflow:'hidden',
              background:'#fff', borderRadius:14,
              boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
            }}>
              {/* ── Actual value (underneath cover) ── */}
              <div style={{padding:'14px 8px 10px',textAlign:'center'}}>
                <div>
                  <span style={{fontSize:'1.4rem',fontWeight:700,color:'#1a1a2e'}}>{m.val??'—'}</span>
                  <span style={{fontSize:'0.68rem',color:'#bbb',marginLeft:2}}>{m.unit}</span>
                </div>
                <div style={{fontSize:'0.58rem',fontWeight:700,letterSpacing:'1px',color:'#bbb',marginTop:3}}>{m.label}</div>
                <div style={{height:3,borderRadius:2,background:m.line,marginTop:8}}/>
              </div>

              {/* ── Cover — icon + shine, slides up after 5 s ── */}
              <div style={{
                position:'absolute', inset:0,
                background: m.accent,
                borderRadius:14,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                gap:5, overflow:'hidden',
                transform: macrosRevealed ? 'translateY(-110%)' : 'translateY(0)',
                transition: macrosRevealed
                  ? `transform 0.65s ${m.delay}ms cubic-bezier(0.22,1,0.36,1)`
                  : 'none',
                pointerEvents: macrosRevealed ? 'none' : 'auto',
              }}>
                {/* Shine sweep */}
                <div style={{
                  position:'absolute', top:0, left:0,
                  width:'55%', height:'100%',
                  background:'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.75) 50%,transparent 65%)',
                  animation:'macroShine 2.4s ease-in-out infinite',
                  pointerEvents:'none',
                }}/>
                {/* Icon */}
                <div>
                  {m.icon}
                </div>
                {/* Label */}
                <div style={{
                  fontSize:'0.5rem', fontWeight:800, letterSpacing:'1.5px',
                  color: m.color, textTransform:'uppercase',
                }}>
                  {m.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ CALORIE BREAKDOWN ══ */}
        <div style={{margin:'12px 16px 0',background:'#fff',borderRadius:16,padding:'16px 18px',boxShadow:'0 1px 6px rgba(0,0,0,0.05)',animation:contentAnim('fadeUp',0.34)}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:14}}>Calorie Breakdown</div>
          <ActivityRings pro={p.pro} fat={p.fat} carb={p.carb} fibre={p.fibre} cal={p.cal} revealed={chartIn}/>
        </div>

        {/* ══ NUTRITION FACTS ══ */}
        {(p.nutrition||[]).length>0 && (
          <div style={{margin:'12px 16px 0',background:'#fff',borderRadius:16,padding:'16px 18px',boxShadow:'0 1px 6px rgba(0,0,0,0.05)',animation:contentAnim('fadeUp',0.4)}}>
            <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:14}}>Nutrition Facts · Per Serving</div>
            {(p.nutrition||[]).map((n,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #F5F2FA'}}>
                <span style={{fontSize:n.s?'0.71rem':'0.78rem',color:n.s?'#ccc':'#444',fontWeight:n.s?400:500,width:130,flexShrink:0,paddingLeft:n.s?12:0}}>{n.n}</span>
                <div style={{flex:1,height:5,background:'#F0EDE6',borderRadius:3,overflow:'hidden'}}>
                  <div style={{
                    width: chartIn ? `${n.p}%` : '0%',
                    height:'100%',
                    background:n.c||'#7B2CBF',
                    borderRadius:3,
                    transition: chartIn ? `width 0.7s ${i * 0.06}s cubic-bezier(0.22,1,0.36,1)` : 'none',
                  }}/>
                </div>
                <span style={{fontSize:'0.76rem',fontWeight:600,color:'#1a1a2e',width:46,textAlign:'right',flexShrink:0}}>{n.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══ INGREDIENTS ══ */}
        {(p.ingr||[]).length>0 && (
          <div style={{margin:'12px 16px 0',background:'#fff',borderRadius:16,padding:'16px 18px',boxShadow:'0 1px 6px rgba(0,0,0,0.05)',animation:contentAnim('fadeUp',0.46)}}>
            <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:14}}>Ingredients Used</div>
            {(p.ingr||[]).map((ing,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:10,background:'#FAF8FF',border:'1px solid #EDE8F8',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:ing.c||'#7B2CBF',display:'inline-block',flexShrink:0}}/>
                  <span style={{fontSize:'0.82rem',fontWeight:500,color:'#1a1a2e'}}>{ing.n}</span>
                </div>
                <span style={{fontSize:'0.72rem',color:'#bbb'}}>{ing.src}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══ REVIEWS ══ */}
        <div style={{margin:'12px 16px 0',animation:contentAnim('fadeUp',0.52)}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:14}}>What Customers Say</div>
          {allRevs.length===0&&<div style={{color:'#ccc',fontSize:'0.82rem',padding:'8px 0'}}>No reviews yet. Be the first!</div>}
          {allRevs.map((r,i)=>{
            const ini=r.ini||(r.name?r.name[0]:'?')
            const bg=r.bg||avatarColor(r.name||'A')
            const date=r.date||(r.created_at?new Date(r.created_at).toLocaleDateString():'')
            return (
              <div key={i} style={{background:'#fff',borderRadius:14,padding:'14px',border:'1px solid #EDE8F8',marginBottom:10,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
                  <div>
                    <div style={{fontSize:'0.82rem',fontWeight:700,color:'#1a1a2e'}}>{r.name}</div>
                    <div style={{fontSize:'0.68rem',color:'#ccc'}}>{date}</div>
                  </div>
                </div>
                <div style={{color:'#F59E0B',fontSize:'0.8rem',marginBottom:4}}>{starStr(r.stars||r.rating)}</div>
                <div style={{fontSize:'0.8rem',color:'#666',lineHeight:1.5}}>{r.txt||r.text}</div>
                {(r.v||r.verified)&&<span style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,padding:'3px 8px',borderRadius:50,background:'rgba(44,182,125,0.08)',fontSize:'0.67rem',color:'#2CB67D',fontWeight:600}}>✓ Verified Order</span>}
              </div>
            )
          })}
        </div>

        {/* ══ PROMISE ══ */}
        <div style={{margin:'12px 16px 0',padding:'18px',borderRadius:16,background:'linear-gradient(135deg,rgba(91,33,182,0.04),rgba(124,58,237,0.08))',border:'1.5px solid rgba(91,33,182,0.1)',animation:contentAnim('fadeUp',0.58)}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#7B2CBF',marginBottom:12}}>The Fofitos Promise</div>
          {['Zero refined oil — cold-pressed only','No MSG or flavour enhancers','No Maida — whole grain always','No artificial colours or preservatives'].map(item=>(
            <div key={item} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:'0.78rem',color:'#666',marginBottom:7,lineHeight:1.45}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:'#7B2CBF',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',fontWeight:700,flexShrink:0,marginTop:1}}>✓</div>
              {item}
            </div>
          ))}
        </div>

        {/* ══ MORE FROM THIS CATEGORY ══ */}
        {savedProducts.filter(x => String(x.id) !== String(productId)).length > 0 && (
          <div style={{marginTop:12, animation:contentAnim('fadeUp',0.56)}}>
            <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:10,padding:'0 16px'}}>
              More from {savedCat?.name || 'this category'}
            </div>
            <div style={{
              display:'flex', gap:10, overflowX:'auto', padding:'4px 16px 12px',
              scrollbarWidth:'none', msOverflowStyle:'none',
            }}>
              {savedProducts.filter(x => String(x.id) !== String(productId)).map(prod => (
                <div
                  key={prod.id}
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); nav(`/product/${prod.id}`, { state: { product: prod, cat: savedCat, products: savedProducts } }) }}
                  style={{
                    flexShrink:0, width:110, background:'#fff', borderRadius:14,
                    overflow:'hidden', border:'1px solid #EDE8F8', cursor:'pointer',
                    boxShadow:'0 2px 8px rgba(91,33,182,0.07)',
                    transition:'transform 0.18s ease, box-shadow 0.18s ease',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 6px 18px rgba(91,33,182,0.14)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 2px 8px rgba(91,33,182,0.07)'}}
                >
                  <div style={{height:82,background:'#F8F5FF',display:'flex',alignItems:'center',justifyContent:'center',padding:8}}>
                    <img src={prod.img} alt={prod.name} style={{width:64,height:64,objectFit:'contain'}}/>
                  </div>
                  <div style={{padding:'7px 9px 10px'}}>
                    <div style={{fontSize:'0.68rem',fontWeight:700,color:'#1a1a2e',lineHeight:1.3,
                      display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                      {prod.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ FOOTER ══ */}
        <Footer />
      </div>

      {/* ══ DESKTOP LAYOUT ══ */}
      <div className="dp-desktop-layout" style={{ background:'#F2EFF8' }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'28px 32px 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

            {/* ════ LEFT COLUMN — sticky product info ════ */}
            <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:28 }}>

              {/* Purple product card */}
              <div style={{
                background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
                borderRadius:18, padding:'22px 24px',
                display:'flex', gap:20, alignItems:'flex-start',
                position:'relative', overflow:'hidden',
                boxShadow:'0 8px 32px rgba(76,29,149,0.35)',
              }}>
                {/* Bubble accent */}
                <div style={{position:'absolute',top:-28,right:-28,width:130,height:130,borderRadius:'50%',background:'rgba(196,181,253,0.18)',pointerEvents:'none',animation:'blobFloat 3s ease-in-out infinite'}}/>
                <div style={{position:'absolute',bottom:-20,left:-10,width:110,height:110,borderRadius:'50%',background:'rgba(91,33,182,0.25)',filter:'blur(28px)',pointerEvents:'none'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)',animation:'shimmerOnce 1.4s 0.2s ease-out forwards',transform:'translateX(-150%)',pointerEvents:'none',zIndex:1}}/>
                <img src={p.img} alt={p.name} style={{ width:120, height:120, objectFit:'contain', flexShrink:0, filter:'drop-shadow(0 10px 28px rgba(0,0,0,0.55))', position:'relative', zIndex:2 }}/>
                <div style={{ flex:1, minWidth:0, position:'relative', zIndex:2 }}>
                  <div style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(196,181,253,0.7)', marginBottom:6 }}>FOFITOS KITCHEN</div>
                  <div style={{ fontSize:'clamp(1.25rem,2vw,1.6rem)', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:5 }}>{p.name}</div>
                  {p.tagline && <div style={{ fontSize:'0.76rem', color:'rgba(196,181,253,0.8)', lineHeight:1.4, marginBottom:12 }}>{p.tagline}</div>}
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                    <span style={{ color:'#FBBF24', fontSize:'0.85rem', letterSpacing:1 }}>{starStr(p.rating||0)}</span>
                    <span style={{ fontWeight:700, color:'#fff', fontSize:'0.82rem' }}>{p.rating}</span>
                    <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.73rem' }}>({p.reviews})</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {(p.tags||[]).map(t => (
                      <span key={t} style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.5px', color:'rgba(255,255,255,0.9)', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:50, padding:'3px 11px', background:'rgba(255,255,255,0.1)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 8px rgba(76,29,149,0.08)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr' }}>
                {[
                  { val:p.cal,  unit:'kcal', label:'Calories' },
                  { val:p.pro,  unit:'g',    label:'Protein'  },
                  { val:p.carb, unit:'g',    label:'Carbs'    },
                ].map((m,i) => (
                  <div key={m.label} style={{ padding:'20px 12px', textAlign:'center', borderRight: i < 2 ? '1px solid #EDE8F8' : 'none' }}>
                    <div>
                      <span style={{ fontSize:'1.65rem', fontWeight:800, color:'#1a1a2e' }}>{m.val??'—'}</span>
                      <span style={{ fontSize:'0.66rem', color:'#bbb', marginLeft:3 }}>{m.unit}</span>
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'#aaa', marginTop:4 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Buttons — below stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <button style={{ height:50, background:'#fff', border:'1.5px solid #FFDAD8', borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(226,36,26,0.1)' }}>
                  <img src={zomatoImg} alt="Zomato" style={{ height:26, objectFit:'contain' }}/>
                </button>
                <button style={{ height:50, background:'#fff', border:'1.5px solid #FFE0C8', borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(252,128,25,0.1)' }}>
                  <img src={swiggyImg} alt="Swiggy" style={{ height:26, objectFit:'contain' }}/>
                </button>
                <button onClick={() => setModal(true)} style={{ height:50, background:'#fff', color:'#4C1D95', border:'2px solid #DDD6FE', borderRadius:12, fontSize:'0.82rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <span style={{ color:'#FBBF24' }}>★</span> Write a Review
                </button>
              </div>

              {/* Fofitos Promise — purple theme */}
              <div style={{ background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)', borderRadius:16, padding:'22px 24px', boxShadow:'0 4px 20px rgba(76,29,149,0.28)' }}>
                <div style={{ fontSize:'1.05rem', fontWeight:700, color:'#C4B5FD', marginBottom:16 }}>The Fofitos Promise</div>
                {['Zero refined oil — cold-pressed only','No MSG or flavour enhancers','No Maida — whole grain always','No artificial colours or preservatives'].map(item => (
                  <div key={item} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(167,139,250,0.18)', border:'1.5px solid rgba(167,139,250,0.5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ color:'#A78BFA', fontSize:'0.6rem', fontWeight:800 }}>✓</span>
                    </div>
                    <span style={{ fontSize:'0.82rem', color:'rgba(221,214,254,0.9)', lineHeight:1.55 }}>{item}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* ════ RIGHT COLUMN — scrollable nutrition data ════ */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Calorie Breakdown */}
              <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:16 }}>Calorie Breakdown</div>
                <ActivityRings pro={p.pro} fat={p.fat} carb={p.carb} fibre={p.fibre} cal={p.cal} revealed={chartIn}/>
              </div>

              {/* Nutrition Facts */}
              {(p.nutrition||[]).length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                  <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:16 }}>Nutrition Facts · Per Serving</div>
                  {(p.nutrition||[]).map((n,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #F3F0FB' }}>
                      <span style={{ fontSize:n.s?'0.71rem':'0.78rem', color:n.s?'#ccc':'#444', fontWeight:n.s?400:500, width:160, flexShrink:0, paddingLeft:n.s?14:0 }}>{n.n}</span>
                      <div style={{ flex:1, height:5, background:'#EDE8F8', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:chartIn?`${n.p}%`:'0%', height:'100%', background:n.c||'#7B2CBF', borderRadius:3, transition:chartIn?`width 0.7s ${i*0.06}s cubic-bezier(0.22,1,0.36,1)`:'none' }}/>
                      </div>
                      <span style={{ fontSize:'0.76rem', fontWeight:600, color:'#1a1a2e', width:46, textAlign:'right', flexShrink:0 }}>{n.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ingredients */}
              {(p.ingr||[]).length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                  <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:14 }}>Ingredients Used</div>
                  {(p.ingr||[]).map((ing,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:10, background:'#FAF8FF', border:'1px solid #EDE8F8', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:ing.c||'#7B2CBF', display:'inline-block', flexShrink:0 }}/>
                        <span style={{ fontSize:'0.82rem', fontWeight:500, color:'#1a1a2e' }}>{ing.n}</span>
                      </div>
                      <span style={{ fontSize:'0.72rem', color:'#bbb' }}>{ing.src}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {allRevs.length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                  <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:14 }}>What Customers Say</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {allRevs.map((r,i) => {
                      const ini = r.ini||(r.name?r.name[0]:'?')
                      const bg  = r.bg||avatarColor(r.name||'A')
                      const date= r.date||(r.created_at?new Date(r.created_at).toLocaleDateString():'')
                      return (
                        <div key={i} style={{ borderRadius:12, padding:'14px', border:'1px solid #EDE8F8', background:'#FAF8FF' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'#fff', flexShrink:0 }}>{ini}</div>
                            <div>
                              <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#1a1a2e' }}>{r.name}</div>
                              <div style={{ fontSize:'0.67rem', color:'#ccc' }}>{date}</div>
                            </div>
                          </div>
                          <div style={{ color:'#F59E0B', fontSize:'0.78rem', marginBottom:4 }}>{starStr(r.stars||r.rating)}</div>
                          <div style={{ fontSize:'0.78rem', color:'#666', lineHeight:1.5 }}>{r.txt||r.text}</div>
                          {(r.v||r.verified) && <span style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:6, padding:'2px 8px', borderRadius:50, background:'rgba(123,44,191,0.08)', fontSize:'0.65rem', color:'#7B2CBF', fontWeight:600 }}>✓ Verified Order</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {/* More from this category — desktop */}
              {savedProducts.filter(x => String(x.id) !== String(productId)).length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                  <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:14 }}>
                    More from {savedCat?.name || 'this category'}
                  </div>
                  <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none', msOverflowStyle:'none' }}>
                    {savedProducts.filter(x => String(x.id) !== String(productId)).map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); nav(`/product/${prod.id}`, { state: { product: prod, cat: savedCat, products: savedProducts } }) }}
                        style={{
                          flexShrink:0, width:120, background:'#F8F5FF', borderRadius:12,
                          overflow:'hidden', border:'1px solid #EDE8F8', cursor:'pointer',
                          boxShadow:'0 1px 6px rgba(91,33,182,0.07)',
                          transition:'transform 0.18s ease, box-shadow 0.18s ease',
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.05)';e.currentTarget.style.boxShadow='0 6px 18px rgba(91,33,182,0.15)'}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 1px 6px rgba(91,33,182,0.07)'}}
                      >
                        <div style={{height:90,display:'flex',alignItems:'center',justifyContent:'center',padding:10}}>
                          <img src={prod.img} alt={prod.name} style={{width:70,height:70,objectFit:'contain'}}/>
                        </div>
                        <div style={{padding:'7px 10px 10px',background:'#fff'}}>
                          <div style={{fontSize:'0.7rem',fontWeight:700,color:'#1a1a2e',lineHeight:1.3,
                            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                            {prod.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

        </div>

        {/* ══ FOOTER (desktop) ══ */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}>
          <Footer />
        </div>
      </div>


      {modal&&<ReviewModal products={allProducts} preSelectedId={p.id} onClose={()=>setModal(false)} onPosted={()=>{setToast('✦ Review posted!');fetchReviews()}}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast('')}/>}
    </>
  )
}
