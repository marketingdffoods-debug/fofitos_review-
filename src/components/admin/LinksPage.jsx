import { useState, useEffect } from 'react'
import { sb } from '../../lib/supabase'

const ROW_ID = 'default'
const EMPTY = {
  zomato_url:      '',
  swiggy_url:      '',
  review_url:      '',
  footer_company:  '',
  footer_fssai:    '',
  footer_gst:      '',
  footer_phone1:   '',
  footer_phone2:   '',
  footer_email:    '',
}

const PLACEHOLDERS = {
  zomato_url:     'https://zomato.com/...',
  swiggy_url:     'https://swiggy.com/...',
  review_url:     'https://g.page/r/... or any review page',
  footer_company: 'Doctor Farmer Foods Private Limited',
  footer_fssai:   '12426023000520',
  footer_gst:     '33AAMCD2507N1ZJ',
  footer_phone1:  '+91 89258 41987',
  footer_phone2:  '+91 89258 41983',
  footer_email:   'doctorfarmerfoods@gmail.com',
}

export default function LinksPage() {
  const [form,    setForm]    = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [notif,   setNotif]   = useState('')

  useEffect(() => {
    sb.from('links').select('*').eq('id', ROW_ID).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            zomato_url:     data.zomato_url     || '',
            swiggy_url:     data.swiggy_url     || '',
            review_url:     data.review_url     || '',
            footer_company: data.footer_company || '',
            footer_fssai:   data.footer_fssai   || '',
            footer_gst:     data.footer_gst     || '',
            footer_phone1:  data.footer_phone1  || '',
            footer_phone2:  data.footer_phone2  || '',
            footer_email:   data.footer_email   || '',
          })
        }
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    await sb.from('links').upsert({ id: ROW_ID, ...form })
    setSaving(false)
    setNotif('✓ Saved successfully')
    setTimeout(() => setNotif(''), 3000)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const Section = ({ title, children }) => (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', marginBottom:24, overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
        <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text)', letterSpacing:'0.5px' }}>{title}</div>
      </div>
      <div style={{ padding:'20px' }}>
        {children}
      </div>
    </div>
  )

  const Field = ({ label, k, dot }) => (
    <div style={{ marginBottom:14 }}>
      <label className="f-label" style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
        {dot && <span style={{ width:8, height:8, borderRadius:'50%', background:dot, display:'inline-block', flexShrink:0 }}/>}
        {label}
        {form[k] && k.endsWith('_url') && (
          <a href={form[k]} target="_blank" rel="noreferrer"
            style={{ marginLeft:'auto', fontSize:'0.7rem', color:'var(--purple)', fontWeight:600, textDecoration:'none' }}>
            Test ↗
          </a>
        )}
      </label>
      <input
        className="f-input"
        value={form[k]}
        onChange={e => set(k, e.target.value)}
        placeholder={PLACEHOLDERS[k]}
      />
    </div>
  )

  return (
    <>
      <div className="admin-content">
        <div style={{ maxWidth:620 }}>

          {loading ? <div className="loading">Loading…</div> : (
            <>
              {/* ── Order Links ── */}
              <Section title="🛒  Order & Review Buttons">
                <p style={{ fontSize:'0.76rem', color:'var(--muted)', marginBottom:18 }}>
                  When a customer taps a button on the product page they'll open this link in a new tab.
                </p>
                <Field label="Zomato URL"          k="zomato_url" dot="#E84040"/>
                <Field label="Swiggy URL"           k="swiggy_url" dot="#FC8019"/>
                <Field label="Write a Review URL"   k="review_url" dot="#7B2CBF"/>
              </Section>

              {/* ── Footer Content ── */}
              <Section title="📄  Footer Content">
                <p style={{ fontSize:'0.76rem', color:'var(--muted)', marginBottom:18 }}>
                  These values appear in the footer across all pages. Leave a field blank to keep the default.
                </p>
                <Field label="Company Name"   k="footer_company"/>
                <Field label="FSSAI Lic. No." k="footer_fssai"/>
                <Field label="GST Number"     k="footer_gst"/>
                <Field label="Phone 1"        k="footer_phone1"/>
                <Field label="Phone 2"        k="footer_phone2"/>
                <Field label="Email"          k="footer_email"/>
              </Section>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth:140 }}>
                {saving ? 'Saving…' : 'Save All'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className={`admin-notif${notif ? ' show' : ''}`}>{notif}</div>
    </>
  )
}
