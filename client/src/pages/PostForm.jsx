import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Save,
  ArrowLeft,
  Image,
  Upload,
  X,
  Calendar,
  User,
  FileText,
  Film,
  Plus,
  Trash2,
  Eye
} from 'lucide-react'

function PostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    pubDate: new Date().toISOString().slice(0, 16)
  })

  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [existingThumbnail, setExistingThumbnail] = useState(null)

  const [media, setMedia] = useState([])
  const [existingMedia, setExistingMedia] = useState([])

  const thumbnailInputRef = useRef(null)
  const mediaInputRef = useRef(null)

  useEffect(() => {
    if (isEditing) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${id}`)
      if (!response.ok) throw new Error('Post non trouvé')
      const post = await response.json()

      setFormData({
        title: post.title,
        content: post.content,
        author: post.author,
        pubDate: new Date(post.pubDate).toISOString().slice(0, 16)
      })

      if (post.thumbnail) {
        setExistingThumbnail(post.thumbnail)
        setThumbnailPreview(post.thumbnail)
      }

      if (post.media && post.media.length > 0) {
        setExistingMedia(post.media)
      }
    } catch (error) {
      console.error('Erreur:', error)
      navigate('/')
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail(file)
      setThumbnailPreview(URL.createObjectURL(file))
      setExistingThumbnail(null)
    }
  }

  const removeThumbnail = () => {
    setThumbnail(null)
    setThumbnailPreview(null)
    setExistingThumbnail(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files)
    setMedia(prev => [...prev, ...files])
  }

  const removeMedia = (index, isExisting = false) => {
    if (isExisting) {
      setExistingMedia(prev => prev.filter((_, i) => i !== index))
    } else {
      setMedia(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('content', formData.content)
      submitData.append('author', formData.author)
      submitData.append('pubDate', new Date(formData.pubDate).toISOString())

      if (thumbnail) {
        submitData.append('thumbnail', thumbnail)
      } else if (!existingThumbnail && isEditing) {
        submitData.append('removeThumbnail', 'true')
      }

      media.forEach(file => {
        submitData.append('media', file)
      })

      if (isEditing && existingMedia.length > 0) {
        submitData.append('existingMedia', JSON.stringify(existingMedia))
      }

      const url = isEditing ? `/api/posts/${id}` : '/api/posts'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: submitData
      })

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde')

      navigate('/')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde du post')
    }
    setSaving(false)
  }

  const getMediaIcon = (type) => {
    if (type.startsWith('image')) return Image
    if (type.startsWith('video')) return Film
    return FileText
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isEditing ? 'Modifier le Post' : 'Nouveau Post'}
            </h2>
            <p className="text-slate-500">
              {isEditing ? 'Modifiez les informations du post' : 'Créez un nouveau post pour votre flux RSS'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            previewMode
              ? 'bg-orange-100 text-orange-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          {previewMode ? 'Éditer' : 'Aperçu'}
        </button>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {thumbnailPreview && (
            <img
              src={thumbnailPreview}
              alt="Thumbnail"
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              {formData.title || 'Titre du post'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {formData.author || 'Auteur'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(formData.pubDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: formData.content || '<p class="text-slate-400">Contenu du post...</p>'
              }}
            />
            {(existingMedia.length > 0 || media.length > 0) && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Médias attachés</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingMedia.map((m, i) => (
                    <div key={`existing-${i}`} className="bg-slate-100 rounded-lg p-3 text-center">
                      {m.type.startsWith('image') ? (
                        <img src={m.url} alt={m.name} className="w-full h-24 object-cover rounded" />
                      ) : (
                        <FileText className="w-8 h-8 mx-auto text-slate-400" />
                      )}
                      <p className="text-xs text-slate-500 mt-2 truncate">{m.name}</p>
                    </div>
                  ))}
                  {media.map((file, i) => (
                    <div key={`new-${i}`} className="bg-slate-100 rounded-lg p-3 text-center">
                      {file.type.startsWith('image') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : (
                        <FileText className="w-8 h-8 mx-auto text-slate-400" />
                      )}
                      <p className="text-xs text-slate-500 mt-2 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thumbnail Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-orange-500" />
              Image de couverture
            </h3>

            {thumbnailPreview ? (
              <div className="relative">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="dropzone cursor-pointer block">
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Cliquez ou glissez une image ici</p>
                <p className="text-slate-400 text-sm mt-1">PNG, JPG, GIF, WebP (max 10MB)</p>
              </label>
            )}
          </div>

          {/* Post Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Informations du post
            </h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Titre de votre post"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Author & Date */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Auteur *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  placeholder="Nom de l'auteur"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de publication *
                </label>
                <input
                  type="datetime-local"
                  name="pubDate"
                  value={formData.pubDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contenu * <span className="text-slate-400 font-normal">(HTML supporté)</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={10}
                placeholder="Rédigez votre contenu ici... Vous pouvez utiliser du HTML."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-2">
                Astuce: Utilisez des balises HTML comme &lt;p&gt;, &lt;strong&gt;, &lt;a&gt; pour formater votre contenu
              </p>
            </div>
          </div>

          {/* Media Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Film className="w-5 h-5 text-orange-500" />
              Médias additionnels
            </h3>

            {/* Existing Media */}
            {existingMedia.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-slate-500 mb-3">Médias existants</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingMedia.map((m, i) => {
                    const Icon = getMediaIcon(m.type)
                    return (
                      <div key={i} className="relative group bg-slate-50 rounded-xl p-3">
                        {m.type.startsWith('image') ? (
                          <img src={m.url} alt={m.name} className="w-full h-24 object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center">
                            <Icon className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2 truncate">{m.name}</p>
                        <button
                          type="button"
                          onClick={() => removeMedia(i, true)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* New Media */}
            {media.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-slate-500 mb-3">Nouveaux médias à ajouter</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {media.map((file, i) => {
                    const Icon = getMediaIcon(file.type)
                    return (
                      <div key={i} className="relative group bg-orange-50 rounded-xl p-3">
                        {file.type.startsWith('image') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center">
                            <Icon className="w-12 h-12 text-orange-300" />
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2 truncate">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => removeMedia(i, false)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upload Zone */}
            <label className="dropzone cursor-pointer block">
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf"
                onChange={handleMediaChange}
                className="hidden"
              />
              <Plus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Ajouter des médias</p>
              <p className="text-slate-400 text-xs mt-1">Images, vidéos, audio, PDF</p>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all font-medium disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Mettre à jour' : 'Publier'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PostForm
