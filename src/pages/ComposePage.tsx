import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxAccount } from '@/types'
import { Send, Bot, Loader2, PenTool, Paperclip, X, FileText } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://plbjafwltwpupspmlnip.supabase.co'
const COMPOSE_URL = `${SUPABASE_URL}/functions/v1/inbox-compose`
const ATTACHMENT_URL = `${SUPABASE_URL}/functions/v1/inbox-attachment`

interface UploadedFile {
  filename: string
  url: string
  path: string
  size: number
  mimeType: string
}

export default function ComposePage() {
  const [accounts, setAccounts] = useState<InboxAccount[]>([])
  const [accountId, setAccountId] = useState('')
  const [selectedModel, setSelectedModel] = useState('sonnet')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [hasHistory, setHasHistory] = useState(false)
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null)
  const [detectedCategoryId, setDetectedCategoryId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: accs } = await supabase.from('inbox_accounts').select('*').eq('is_active', true).order('created_at')
      setAccounts(accs || [])
      if (accs && accs.length > 0) setAccountId(accs[0].id)
    }
    load()
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !accountId) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('account_id', accountId)
      try {
        const res = await fetch(`${ATTACHMENT_URL}?action=upload`, { method: 'POST', body: formData })
        const data = await res.json()
        if (data.url) {
          setAttachments(prev => [...prev, { filename: data.filename, url: data.url, path: data.path, size: data.size, mimeType: data.mimeType }])
        }
      } catch (err) {
        alert(`Erreur upload: ${err}`)
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  async function generate() {
    if (!to) return
    setGenerating(true)
    setDetectedCategory(null)
    try {
      const res = await fetch(COMPOSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', to, subject, notes, model: selectedModel }),
      })
      const data = await res.json()
      if (data.subject) setSubject(data.subject)
      if (data.body) setBody(data.body)
      setHasHistory(data.has_history || false)
      setDetectedCategory(data.detected_category || null)
      setDetectedCategoryId(data.detected_category_id || null)
    } catch (e) {
      alert(`Erreur: ${e}`)
    }
    setGenerating(false)
  }

  async function send() {
    if (!accountId || !to || !subject || !body) return
    setSending(true)
    try {
      const res = await fetch(COMPOSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          account_id: accountId,
          to,
          subject,
          body,
          category_id: detectedCategoryId,
          attachments: attachments.map(a => ({ filename: a.filename, url: a.url, path: a.path, size: a.size, mimeType: a.mimeType })),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        setTimeout(() => {
          setSent(false)
          setTo('')
          setSubject('')
          setBody('')
          setNotes('')
          setDetectedCategory(null)
          setDetectedCategoryId(null)
          setHasHistory(false)
          setAttachments([])
        }, 3000)
      } else {
        alert(`Erreur: ${data.error}`)
      }
    } catch (e) {
      alert(`Erreur: ${e}`)
    }
    setSending(false)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold flex items-center gap-2 mb-6">
        <PenTool size={20} />
        Composer un email
      </h1>

      {sent && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm">
          Email envoyé avec succès !
        </div>
      )}

      <div className="space-y-4">
        {/* Compte d'envoi + Modèle */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-text-muted mb-1 block">Envoyer depuis</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.label} ({a.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Modèle IA</label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2"
            >
              <option value="haiku">Haiku (rapide)</option>
              <option value="sonnet">Sonnet (recommandé)</option>
              <option value="opus">Opus (complexe)</option>
            </select>
          </div>
        </div>

        {/* Destinataire */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Destinataire</label>
          <input
            type="email"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="client@example.com"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Objet */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Objet (optionnel — l'IA peut le générer)</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="L'IA génère l'objet si vide"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Notes / brouillon */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Décris ce que tu veux envoyer</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={"Exemples :\n• Relance client sur proposition envoyée le 20 mars\n• Réponse SAV problème filtration piscine\n• Envoi devis rénovation piscine 8x4\n• Mail de suivi après intervention"}
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Pièces jointes */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Pièces jointes</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
              {uploading ? 'Upload...' : 'Joindre un fichier'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                  <FileText size={14} className="text-text-muted" />
                  <span className="flex-1 truncate">{a.filename}</span>
                  <span className="text-xs text-text-muted">{formatSize(a.size)}</span>
                  <button onClick={() => removeAttachment(i)} className="text-text-muted hover:text-danger">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton Générer */}
        <button
          onClick={generate}
          disabled={!to || generating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
          {generating ? 'Analyse et rédaction...' : 'Générer avec l\'IA'}
        </button>

        {/* Badges contexte */}
        {(detectedCategory || hasHistory) && (
          <div className="flex gap-2 flex-wrap">
            {detectedCategory && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Bot size={10} /> Type détecté : {detectedCategory}
              </span>
            )}
            {hasHistory && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Bot size={10} /> Historique client trouvé
              </span>
            )}
          </div>
        )}

        {/* Corps du mail (éditable) */}
        {body && (
          <>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Email généré (modifiable avant envoi)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={14}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={send}
                disabled={!accountId || !to || !subject || !body || sending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Envoi...' : `Envoyer${attachments.length > 0 ? ` (${attachments.length} PJ)` : ''}`}
              </button>
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 border border-border text-text-secondary rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <Bot size={14} />
                Régénérer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
