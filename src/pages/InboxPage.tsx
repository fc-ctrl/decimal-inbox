import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxThread, InboxCategory } from '@/types'
import { Mail, Star, Archive, Search, Filter, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ThreadDetail from '@/components/ThreadDetail'

const channelIcons: Record<string, string> = {
  gmail: 'G',
  outlook: 'O',
  sms: 'S',
}

const channelColors: Record<string, string> = {
  gmail: 'bg-red-100 text-red-700',
  outlook: 'bg-blue-100 text-blue-700',
  sms: 'bg-green-100 text-green-700',
}

export default function InboxPage() {
  const [threads, setThreads] = useState<InboxThread[]>([])
  const [categories, setCategories] = useState<InboxCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterChannel, setFilterChannel] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: threadsData }, { data: catsData }] = await Promise.all([
      supabase
        .from('inbox_threads')
        .select('*, category:inbox_categories(*), account:inbox_accounts(*)')
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })
        .limit(100),
      supabase.from('inbox_categories').select('*').order('sort_order'),
    ])
    setThreads(threadsData || [])
    setCategories(catsData || [])
    setLoading(false)
  }

  async function toggleStar(thread: InboxThread) {
    const newVal = !thread.is_starred
    await supabase.from('inbox_threads').update({ is_starred: newVal }).eq('id', thread.id)
    setThreads(ts => ts.map(t => (t.id === thread.id ? { ...t, is_starred: newVal } : t)))
  }

  async function archiveThread(thread: InboxThread) {
    await supabase.from('inbox_threads').update({ is_archived: true }).eq('id', thread.id)
    setThreads(ts => ts.filter(t => t.id !== thread.id))
    if (selectedThread?.id === thread.id) setSelectedThread(null)
  }

  async function markAsRead(thread: InboxThread) {
    if (thread.is_read) return
    await supabase.from('inbox_threads').update({ is_read: true }).eq('id', thread.id)
    setThreads(ts => ts.map(t => (t.id === thread.id ? { ...t, is_read: true } : t)))
  }

  const filtered = threads.filter(t => {
    if (filterCategory !== 'all' && t.category_id !== filterCategory) return false
    if (filterChannel !== 'all' && t.channel !== filterChannel) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        t.subject.toLowerCase().includes(s) ||
        t.from_name.toLowerCase().includes(s) ||
        t.from_address.toLowerCase().includes(s) ||
        t.snippet.toLowerCase().includes(s)
      )
    }
    return true
  })

  const unreadCount = threads.filter(t => !t.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex overflow-hidden absolute inset-0">
      {/* Thread list */}
      <div className={`${selectedThread ? 'w-96' : 'flex-1'} border-r border-border flex flex-col bg-white`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Mail size={20} />
              Inbox
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <button onClick={loadData} className="text-text-muted hover:text-primary transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <Filter size={14} className="text-text-muted" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="text-xs border border-border rounded px-2 py-1"
              >
                <option value="all">Toutes catégories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1"
            >
              <option value="all">Tous canaux</option>
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              Aucun message
            </div>
          ) : (
            filtered.map(thread => (
              <div
                key={thread.id}
                onClick={() => {
                  setSelectedThread(thread)
                  markAsRead(thread)
                }}
                className={`p-3 border-b border-border cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-primary-light' : ''
                } ${!thread.is_read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {/* Channel badge */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${channelColors[thread.channel] || 'bg-gray-100 text-gray-600'}`}>
                    {channelIcons[thread.channel] || '?'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${!thread.is_read ? 'font-semibold' : ''}`}>
                        {thread.from_name || thread.from_address}
                      </span>
                      <span className="text-[11px] text-text-muted ml-2 whitespace-nowrap">
                        {format(new Date(thread.last_message_at), 'dd MMM HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <div className={`text-sm truncate ${!thread.is_read ? 'font-medium text-text' : 'text-text-secondary'}`}>
                      {thread.subject}
                    </div>
                    <div className="text-xs text-text-muted truncate mt-0.5">
                      {thread.snippet}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {thread.category && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: thread.category.color + '20', color: thread.category.color }}
                        >
                          {thread.category.name}
                        </span>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={e => { e.stopPropagation(); toggleStar(thread) }}
                        className={`${thread.is_starred ? 'text-warning' : 'text-text-muted opacity-0 group-hover:opacity-100'} hover:text-warning transition-all`}
                      >
                        <Star size={14} fill={thread.is_starred ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); archiveThread(thread) }}
                        className="text-text-muted hover:text-text-secondary transition-colors"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Thread detail */}
      {selectedThread && (
        <ThreadDetail
          thread={selectedThread}
          onClose={() => setSelectedThread(null)}
        />
      )}
    </div>
  )
}
