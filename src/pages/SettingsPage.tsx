import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { InboxAccount } from '@/types'
import { Settings, Trash2, Mail, CheckCircle, XCircle, RefreshCw, MessageSquare } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://plbjafwltwpupspmlnip.supabase.co'
const GMAIL_OAUTH_URL = `${SUPABASE_URL}/functions/v1/gmail-oauth`
const OUTLOOK_OAUTH_URL = `${SUPABASE_URL}/functions/v1/outlook-oauth`
const FACEBOOK_OAUTH_URL = `${SUPABASE_URL}/functions/v1/facebook-oauth`
const SYNC_URL = `${SUPABASE_URL}/functions/v1/inbox-sync`

const channelColors: Record<string, string> = {
  gmail: 'bg-red-100 text-red-700',
  outlook: 'bg-blue-100 text-blue-700',
  facebook: 'bg-indigo-100 text-indigo-700',
  sms: 'bg-green-100 text-green-700',
}

const channelIcons: Record<string, string> = {
  gmail: 'G',
  outlook: 'O',
  facebook: 'F',
  sms: 'S',
}

export default function SettingsPage() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState<InboxAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const successParam = searchParams.get('success')
  const errorParam = searchParams.get('error')

  useEffect(() => {
    loadAccounts()
    if (successParam || errorParam) {
      setTimeout(() => setSearchParams({}, { replace: true }), 5000)
    }
  }, [])

  async function loadAccounts() {
    setLoading(true)
    const { data } = await supabase.from('inbox_accounts').select('*').order('created_at')
    setAccounts(data || [])
    setLoading(false)
  }

  function connectGmail() {
    if (!profile?.id) return
    const url = `${GMAIL_OAUTH_URL}?action=authorize&user_id=${profile.id}&label=Gmail`
    window.location.href = url
  }

  function connectOutlook() {
    if (!profile?.id) return
    const url = `${OUTLOOK_OAUTH_URL}?action=authorize&user_id=${profile.id}&label=Outlook`
    window.location.href = url
  }

  function connectFacebook() {
    if (!profile?.id) return
    const url = `${FACEBOOK_OAUTH_URL}?action=authorize&user_id=${profile.id}&label=Facebook`
    window.location.href = url
  }

  async function syncNow() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch(SYNC_URL, { method: 'POST' })
      const data = await res.json()
      const total = data.results?.reduce((s: number, r: { synced?: number }) => s + (r.synced || 0), 0) || 0
      const channels = data.results?.map((r: { channel?: string; synced?: number }) => `${r.channel}: ${r.synced || 0}`).join(', ') || ''
      setSyncResult(`${total} nouveau(x) message(s) synchronisé(s) (${channels})`)
    } catch (e) {
      setSyncResult(`Erreur: ${e}`)
    }
    setSyncing(false)
  }

  async function toggleAccount(account: InboxAccount) {
    const newVal = !account.is_active
    await supabase.from('inbox_accounts').update({ is_active: newVal }).eq('id', account.id)
    setAccounts(as => as.map(a => (a.id === account.id ? { ...a, is_active: newVal } : a)))
  }

  async function deleteAccount(id: string) {
    if (!confirm('Supprimer ce compte ? Les messages synchronisés seront conservés.')) return
    await supabase.from('inbox_accounts').delete().eq('id', id)
    setAccounts(as => as.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold flex items-center gap-2 mb-6">
        <Settings size={20} />
        Paramètres
      </h1>

      {/* Success/Error notifications */}
      {successParam && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm">
          {successParam === 'gmail' && 'Compte Gmail connecté avec succès !'}
          {successParam === 'outlook' && 'Compte Outlook connecté avec succès !'}
          {successParam === 'facebook' && 'Page Facebook connectée avec succès !'}
        </div>
      )}
      {errorParam && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-sm">
          Erreur : {errorParam}
        </div>
      )}

      {/* Comptes connectés */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">Comptes connectés</h2>
          {accounts.length > 0 && (
            <button
              onClick={syncNow}
              disabled={syncing}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sync...' : 'Synchroniser'}
            </button>
          )}
        </div>

        {syncResult && (
          <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-2 text-sm">
            {syncResult}
          </div>
        )}

        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {accounts.map(account => (
            <div key={account.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded ${channelColors[account.channel] || 'bg-gray-100 text-gray-600'}`}>
                  {channelIcons[account.channel] || '?'}
                </span>
                <div>
                  <div className="text-sm font-medium">{account.label}</div>
                  <div className="text-xs text-text-muted">{account.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAccount(account)}
                  className={`flex items-center gap-1 text-xs ${account.is_active ? 'text-success' : 'text-text-muted'}`}
                >
                  {account.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {account.is_active ? 'Actif' : 'Inactif'}
                </button>
                <button onClick={() => deleteAccount(account.id)} className="text-text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="p-6 text-center text-text-muted text-sm">
              Aucun compte connecté. Ajoutez un canal ci-dessous.
            </div>
          )}
        </div>
      </div>

      {/* Ajouter un canal */}
      <div className="mb-8">
        <h2 className="text-base font-medium mb-4">Ajouter un canal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={connectGmail}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-border rounded-xl text-sm hover:border-red-300 hover:bg-red-50 transition-colors"
          >
            <Mail size={18} className="text-red-600" />
            <div className="text-left">
              <div className="font-medium">Gmail</div>
              <div className="text-xs text-text-muted">Google Workspace</div>
            </div>
          </button>
          <button
            onClick={connectOutlook}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-border rounded-xl text-sm hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Mail size={18} className="text-blue-600" />
            <div className="text-left">
              <div className="font-medium">Outlook</div>
              <div className="text-xs text-text-muted">Microsoft 365</div>
            </div>
          </button>
          <button
            onClick={connectFacebook}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-border rounded-xl text-sm hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <MessageSquare size={18} className="text-indigo-600" />
            <div className="text-left">
              <div className="font-medium">Facebook</div>
              <div className="text-xs text-text-muted">Messenger Pages</div>
            </div>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Comment ça marche ?</p>
        <ul className="list-disc ml-4 space-y-1 text-xs">
          <li>Connectez vos comptes en un clic via OAuth2 (sécurisé)</li>
          <li>Les messages sont synchronisés automatiquement toutes les 2 minutes</li>
          <li>Configurez des catégories et règles de routage intelligent</li>
          <li>Répondez directement depuis Decimal Inbox</li>
        </ul>
      </div>
    </div>
  )
}
