import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxThread, InboxMessage } from '@/types'
import { X, Send, Paperclip, Reply } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  thread: InboxThread
  onClose: () => void
}

export default function ThreadDetail({ thread, onClose }: Props) {
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [showReply, setShowReply] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [thread.id])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('sent_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  async function handleSendReply() {
    if (!replyText.trim()) return
    setSending(true)

    // Insert outbound message
    const { error } = await supabase.from('inbox_messages').insert({
      thread_id: thread.id,
      account_id: thread.account_id,
      channel: thread.channel,
      direction: 'outbound',
      from_name: 'Moi',
      from_address: thread.account?.email || '',
      to_addresses: [thread.from_address],
      cc_addresses: [],
      subject: `Re: ${thread.subject}`,
      body_text: replyText,
      body_html: `<p>${replyText.replace(/\n/g, '<br/>')}</p>`,
      attachments: [],
      external_id: '',
      sent_at: new Date().toISOString(),
    })

    if (!error) {
      setReplyText('')
      setShowReply(false)
      await loadMessages()
      // Update thread last_message_at
      await supabase.from('inbox_threads').update({
        last_message_at: new Date().toISOString(),
        message_count: (thread.message_count || 0) + 1,
      }).eq('id', thread.id)
    }
    setSending(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold truncate">{thread.subject}</h2>
          <p className="text-xs text-text-muted">
            {thread.from_name} &lt;{thread.from_address}&gt;
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text transition-colors ml-3">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">Aucun message dans ce fil</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`rounded-lg border border-border p-4 ${
                msg.direction === 'outbound' ? 'bg-primary-light ml-8' : 'bg-white mr-8'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {msg.direction === 'outbound' ? 'Moi' : msg.from_name || msg.from_address}
                </span>
                <span className="text-[11px] text-text-muted">
                  {format(new Date(msg.sent_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                </span>
              </div>
              {msg.body_html ? (
                <div
                  className="text-sm text-text-secondary prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: msg.body_html }}
                />
              ) : (
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{msg.body_text}</p>
              )}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                      <Paperclip size={12} />
                      {att.filename}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply */}
      <div className="border-t border-border p-4">
        {showReply ? (
          <div className="space-y-3">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Votre réponse..."
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setShowReply(false); setReplyText('') }}
                className="text-sm text-text-muted hover:text-text-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowReply(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors"
          >
            <Reply size={16} />
            Répondre
          </button>
        )}
      </div>
    </div>
  )
}
