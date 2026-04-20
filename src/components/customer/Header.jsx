import { useNavigate } from 'react-router-dom'
import logoImg from '../../assets/logo.png'
import manLogo from '../../assets/man-logo.png'

/**
 * Shared page header.
 * Props:
 *   showBack  — show the ← circle button to the left of the card (default false)
 *   onBack    — override back action (default: navigate to '/')
 */
export default function Header({ showBack = false, onBack }) {
  const nav = useNavigate()
  const handleBack = onBack || (() => nav('/'))

  return (
    <div className="hdr-outer">

      {/* ← Back button — only on inner pages */}
      {showBack && (
        <button
          onClick={handleBack}
          className="hdr-back-btn"
          onMouseEnter={e => { e.currentTarget.style.background = '#5B21B6'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#5B21B6' }}
        >←</button>
      )}

      {/* Card + mascot wrapper */}
      <div className="hdr-card-wrap">

        {/* Glossy card */}
        <div className="hdr-card">
          {/* Top gloss shine */}
          <div className="hdr-gloss" />

          {/* FOFiTOS logo + tagline */}
          <div className="hdr-logo-zone">
            <img src={logoImg} alt="FOFiTOS" className="hdr-logo-img" />
            <div className="hdr-tagline">Product of Doctor Farmer Foods</div>
          </div>
        </div>

        {/* Mascot — outside card so it can extend below the border */}
        <div className="hdr-mascot-wrap">
          <img src={manLogo} alt="mascot" className="hdr-mascot-img" />
        </div>

      </div>
    </div>
  )
}
