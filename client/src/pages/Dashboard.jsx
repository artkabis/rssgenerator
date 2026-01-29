import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  User,
  Image,
  FileText,
  Rss,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react'
import { stripHtml, escapeHtml } from '../utils/sanitize'
import api from '../api/mockApi'

function Dashboard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const isDemo = api.isStaticMode()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const data = await api.getPosts()
      setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    try {
      await api.deletePost(id)
      setPosts(posts.filter(post => post.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">Demo Mode</p>
            <p className="text-amber-600 text-sm">
              Changes will not be saved. Deploy your own instance for full functionality.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My RSS Posts</h2>
          <p className="text-slate-500">{posts.length} post{posts.length > 1 ? 's' : ''} total</p>
        </div>

        <Link
          to="/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all font-medium"
        >
          <PlusCircle className="w-5 h-5" />
          New Post
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Rss className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">
            {posts.length === 0 ? 'No posts yet' : 'No results'}
          </h3>
          <p className="text-slate-400 mb-6">
            {posts.length === 0
              ? 'Start by creating your first RSS post'
              : 'Try different search terms'}
          </p>
          {posts.length === 0 && (
            <Link
              to="/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Create my first post
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-hover animate-slideIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Thumbnail */}
              {post.thumbnail ? (
                <div className="relative h-48 bg-slate-100">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  {post.media && post.media.length > 0 && (
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-lg flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      +{post.media.length}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-orange-300" />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                  {stripHtml(post.content)}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.pubDate)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Link
                    to={`/edit/${post.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>

                  {deleteConfirm === post.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
