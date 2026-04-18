export default function Footer() {
  return (
    <div style={{
      margin: '24px 16px 0',
      padding: '20px 18px 32px',
      borderTop: '1px solid rgba(0,0,0,0.07)',
      background: 'transparent',
    }}>
      {/* Company block */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontSize: '0.58rem', fontWeight: 600, letterSpacing: '2px',
          textTransform: 'uppercase', color: '#bbb', marginBottom: 5,
        }}>
          A Product Of
        </div>
        <div style={{
          fontSize: '0.88rem', fontWeight: 700, color: '#888',
          lineHeight: 1.3, marginBottom: 6,
        }}>
          Doctor Farmer Foods Private Limited
        </div>
        {/* FSSAI & GST — directly below company name */}
        <div style={{
          fontSize: '0.62rem', color: '#bbb', fontWeight: 500,
          letterSpacing: '0.2px', lineHeight: 1.7,
        }}>
          FSSAI Lic. No. 12426023000520
          <br />
          GST 33AAMCD2507N1ZJ
        </div>
      </div>

      {/* Contact links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        <a href="tel:+918925841987" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          <span style={{ fontSize: '0.73rem', color: '#aaa', fontWeight: 400 }}>
            +91 89258 41987 &nbsp;·&nbsp; +91 89258 41983
          </span>
        </a>
        <a href="mailto:doctorfarmerfoods@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span style={{ fontSize: '0.73rem', color: '#aaa', fontWeight: 400 }}>
            doctorfarmerfoods@gmail.com
          </span>
        </a>
        <a href="https://doctorfarmerfoods.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          <span style={{ fontSize: '0.73rem', color: '#aaa', fontWeight: 400 }}>
            doctorfarmerfoods.com
          </span>
        </a>
      </div>

      {/* Copyright */}
      <div style={{
        fontSize: '0.58rem', color: '#ccc',
        textAlign: 'center', letterSpacing: '0.3px',
        paddingTop: 14,
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}>
        © {new Date().getFullYear()} Doctor Farmer Foods Pvt. Ltd. All rights reserved.
      </div>
    </div>
  )
}
