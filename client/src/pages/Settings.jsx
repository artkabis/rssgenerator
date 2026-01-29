import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Save,
  Globe,
  Mail,
  FileText,
  Languages,
  Copyright,
  Check,
  Rss,
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react'
import api from '../api/mockApi'

function Settings() {
  const [config, setConfig] = useState({
    title: '',
    description: '',
    link: '',
    language: 'fr-FR',
    copyright: '',
    managingEditor: '',
    webMaster: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const isDemo = api.isStaticMode()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const data = await api.getConfig()
      setConfig(data)
    } catch (error) {
      console.error('Error loading configuration:', error)
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.updateConfig(config)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving configuration')
    }
    setSaving(false)
  }

  const copyFeedUrl = () => {
    const feedUrl = `${window.location.origin}/rss/feed.xml`
    navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const languages = [
    { code: 'fr-FR', label: 'Français (France)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es-ES', label: 'Español' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'it-IT', label: 'Italiano' },
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'nl-NL', label: 'Nederlands' },
    { code: 'ja-JP', label: '日本語' },
    { code: 'zh-CN', label: '中文 (简体)' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-orange-500" />
          RSS Feed Settings
        </h2>
        <p className="text-slate-500 mt-1">
          Configure the general information for your RSS feed
        </p>
      </div>

      {/* RSS Feed URL Card */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Rss className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Your RSS Feed URL</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/20 backdrop-blur rounded-lg px-4 py-3 font-mono text-sm">
            {window.location.origin}/rss/feed.xml
          </div>
          <button
            onClick={copyFeedUrl}
            className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <a
            href="/rss/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            Open
          </a>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Feed Title
            </label>
            <input
              type="text"
              name="title"
              value={config.title}
              onChange={handleInputChange}
              placeholder="My Awesome RSS Feed"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Description
            </label>
            <textarea
              name="description"
              value={config.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="A description of your RSS feed..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Link */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Globe className="w-4 h-4 text-orange-500" />
              Website URL
            </label>
            <input
              type="url"
              name="link"
              value={config.link}
              onChange={handleInputChange}
              placeholder="https://mysite.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              The base URL used to build links in the RSS feed
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Languages className="w-4 h-4 text-orange-500" />
              Language
            </label>
            <select
              name="language"
              value={config.language}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Copyright */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Copyright className="w-4 h-4 text-orange-500" />
              Copyright
            </label>
            <input
              type="text"
              name="copyright"
              value={config.copyright}
              onChange={handleInputChange}
              placeholder={`© ${new Date().getFullYear()} Mon Site`}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Emails */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 text-orange-500" />
                Editor Email
              </label>
              <input
                type="email"
                name="managingEditor"
                value={config.managingEditor}
                onChange={handleInputChange}
                placeholder="editor@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 text-orange-500" />
                Webmaster Email
              </label>
              <input
                type="email"
                name="webMaster"
                value={config.webMaster}
                onChange={handleInputChange}
                placeholder="webmaster@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="flex items-center gap-2 text-green-600 animate-fadeIn">
              <Check className="w-5 h-5" />
              Configuration saved!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all font-medium disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-12 bg-slate-50 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-800 mb-4">How to use your RSS feed?</h3>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>Copy your RSS feed URL above</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>Paste it into your favorite RSS reader (Feedly, Inoreader, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>Or embed it in your website with a link tag</span>
          </li>
        </ul>
        <div className="mt-4 p-4 bg-slate-800 rounded-lg">
          <code className="text-sm text-green-400">
            &lt;link rel="alternate" type="application/rss+xml" title="My feed" href="/rss/feed.xml" /&gt;
          </code>
        </div>
      </div>
    </div>
  )
}

export default Settings
