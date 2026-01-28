import { Outlet, NavLink } from 'react-router-dom'
import { Rss, Home, PlusCircle, Settings, Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import api from '../api/mockApi'

function Layout() {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const isDemo = api.isStaticMode()

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const result = await api.regenerateRSS()
      alert(isDemo ? 'Mode démo : régénération simulée' : 'Flux RSS régénéré avec succès !')
    } catch (error) {
      alert('Erreur lors de la régénération')
    }
    setIsRegenerating(false)
  }

  const handleDownload = () => {
    window.open('/rss/feed.xml', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg group-hover:shadow-orange-200 transition-all">
                <Rss className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">RSS Generator</h1>
                <p className="text-xs text-slate-500">Dashboard</p>
              </div>
            </NavLink>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Accueil</span>
              </NavLink>

              <NavLink
                to="/new"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau Post</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Paramètres</span>
              </NavLink>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
                title="Régénérer le flux RSS"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Régénérer</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg hover:shadow-orange-200 transition-all font-medium"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Télécharger RSS</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-slate-500">
            RSS Generator Dashboard - Flux disponible sur{' '}
            <a
              href="/rss/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              /rss/feed.xml
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
