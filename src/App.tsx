import { Routes, Route } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import TwoDPage from './pages/TwoDPage'
import ThreeDPage from './pages/ThreeDPage'
import CalendarPage from './pages/CalendarPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <SettingsProvider>
      <Routes>
        <Route path="/admin" element={<AdminLayout><AdminPage /></AdminLayout>} />
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="2d" element={<TwoDPage />} />
          <Route path="3d" element={<ThreeDPage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>
      </Routes>
    </SettingsProvider>
  )
}
