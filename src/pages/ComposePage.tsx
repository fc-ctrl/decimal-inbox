import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxAccount, InboxCategory } from '@/types'
import { Send, Bot, Loader2, PenTool } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://plbjafwltwpupspmlnip.supabase.co'
const COMPOSE_URL = `${SUPABASE_URL}/functions/v1/inbox-compose`

const modes = [
  { value: 'template', label: 'Propale (template Cosy)', desc: 'Proposition commerciale standard' },
  { value: 'reformulation', label: 'Reformulation', desc: 'Transforme tes notes en email pro' },
  { value: 'expert', label: 'Expert', desc: 'Analyse + optimisation IA' },
  { value: 'libre', label: 'Libre', desc: 'Rédaction libre assistée' },
]

export default function ComposePage() {
  const [accounts, setAccounts] = useState<InboxAccount[]>([])
  const [categories, setCategories] = useState<InboxCategory[]>([])
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [mode, setMode] = useState('libre')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [hasHistory, setHasHistory] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: accs }, { data: cats }] = await Promise.all([
        supabase.from('inbox_accounts').select('*').eq('is_active', true).order('created_at'),
        supabase.from('inbox_categories').select('*').order('sort_order'),
      ])
      setAccounts(accs || [])
      setCategories(cats || [])
      if (accs && accs.length > 0) setAccountId(accs[0].id)
      if (cats && cats.length > 0) setCategoryId(cats[0].id)
    }
    load()
  }, [])

  async function generate() {
    if (!to) return
    setGenerating(true)
    try {
      const res = await fetch(COMPOSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', to, subject, mode, category_id: categoryId, notes }),
      })
      const data = await res.json()
      if (data.subject) setSubject(data.subject)
      if (data.body) setBody(data.body)
      setHasHistory(data.has_history || false)
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
        body: JSON.stringify({ action: 'send', account_id: accountId, to, subject, body, category_id: categoryId }),
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
          <div className="flex-1">
            <label className="text-xs text-text-muted mb-1 block">Type de mail</label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2"
            >
              {modes.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Catégorie (instructions IA)</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2"
          >
            <option value="">— Aucune catégorie —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
          {hasHistory && (
            <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
              <Bot size={12} /> Historique client trouvé — l'IA a le contexte
            </p>
          )}
        </div>

        {/* Objet */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Objet</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Objet de l'email (optionnel si IA génère)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Notes / brouillon pour l'IA */}
        <div>
          <label className="text-xs text-text-muted mb-1 block">Notes / brouillon (pour l'IA)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={"Écris tes idées, points à aborder, contexte...\nL'IA transformera en email professionnel."}
            rows={3}
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
          {generating ? 'Génération...' : 'Générer avec l\'IA'}
        </button>

        {/* Corps du mail (éditable) */}
        {body && (
          <>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Email généré (modifiable)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono"
              />
            </div>

            {/* Bouton Envoyer */}
            <button
              onClick={send}
              disabled={!accountId || !to || !subject || !body || sending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
        <p className="font-medium mb-1">Modes de rédaction</p>
        <ul className="list-disc ml-4 space-y-1 text-xs">
          {modes.map(m => (
            <li key={m.value}><strong>{m.label}</strong> — {m.desc}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
