import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PostForm from './pages/PostForm'
import Settings from './pages/Settings'

// Utilise HashRouter pour la compatibilité GitHub Pages
// Les URLs seront de la forme: /#/ /#/new /#/settings
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<PostForm />} />
          <Route path="edit/:id" element={<PostForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
