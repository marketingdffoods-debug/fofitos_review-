import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { sb } from './lib/supabase'
import HomePage from './components/customer/HomePage'
import CategoryPage from './components/customer/CategoryPage'
import DetailPage from './components/customer/DetailPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './components/admin/AdminLogin'
import Dashboard from './components/admin/Dashboard'
import ProductsPage from './components/admin/ProductsPage'
import CategoriesPage from './components/admin/CategoriesPage'
import ReviewsPage from './components/admin/ReviewsPage'
import QRPage from './components/admin/QRPage'
import GoRedirect from './components/GoRedirect'

/* ── Auth guard: blocks /admin/* when not signed in ── */
function AuthGuard({ children }) {
  const [checked, setChecked] = useState(false)
  const [authed,  setAuthed]  = useState(false)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setChecked(true)
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!checked) return null          // wait for session check
  if (!authed)  return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Customer routes ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:catId" element={<CategoryPage />} />
        <Route path="/product/:productId" element={<DetailPage />} />

        {/* ── QR Redirect routes ── */}
        <Route path="/go/:id" element={<GoRedirect />} />

        {/* ── Admin login (public) ── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Admin panel (protected) ── */}
        <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="qr" element={<QRPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
