import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxAccount, InboxCategory } from '@/types'
import { Send, Bot, Loader2, PenTool } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://plbjafwltwpupspmlnip.supabase.co'
const COMPOSE_URL = `${SUPABASE_URL}/functions/v1/inbox-compose`

export default function ComposePage() {
  const [accounts, setAccounts] = useState<InboxAccount[]>([])
  const [categories, setCategories] = useState<InboxCategory[]>([])
  const [accountId, setAccountId] = useState('')
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

  useEffect(() => {
    async function load() {
      const [{ data: accs }, { data: cats }] = await Promise.all([
        supabase.from('inbox_accounts').select('*').eq('is_active', true).order('created_at'),
        supabase.from('inbox_categories').select('*').order('sort_order'),
      ])
      setAccounts(accs || [])
      setCategories(cats || [])
      if (accs && accs.length > 0) setAccountId(accs[0].id)
    }
    load()
  }, [])

  async function generate() {
    if (!to) return
    setGenerating(true)
    setDetectedCategory(null)
    try {
      const res = await fetch(COMPOSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', to, subject, notes }),
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
        body: JSON.stringify({ action: 'send', account_id: accountId, to, subject, body, category_id: detectedCategoryId }),
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
        {/* Compte d'envoi */}
        <div>
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
                {sending ? 'Envoi...' : 'Envoyer'}
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
