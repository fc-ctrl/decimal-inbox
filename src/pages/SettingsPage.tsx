import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxAccount } from '@/types'
import { Settings, Plus, Trash2, Mail, CheckCircle, XCircle } from 'lucide-react'

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<InboxAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    setLoading(true)
    const { data } = await supabase.from('inbox_accounts').select('*').order('created_at')
    setAccounts(data || [])
    setLoading(false)
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

  const channelLabel: Record<string, string> = {
    gmail: 'Gmail',
    outlook: 'Outlook',
    sms: 'SMS',
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

      {/* Comptes connectés */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">Comptes connectés</h2>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
          >
            <Plus size={14} />
            Ajouter un compte
          </button>
        </div>

        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {accounts.map(account => (
            <div key={account.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-text-muted" />
                <div>
                  <div className="text-sm font-medium">{account.label}</div>
                  <div className="text-xs text-text-muted">{account.email} — {channelLabel[account.channel] || account.channel}</div>
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
              Aucun compte connecté. Ajoutez votre premier compte Gmail ou Outlook.
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Comment ça marche ?</p>
        <ul className="list-disc ml-4 space-y-1 text-xs">
          <li>Ajoutez vos comptes Gmail et/ou Outlook</li>
          <li>Configurez des catégories et règles de routage</li>
          <li>Les messages sont synchronisés automatiquement via n8n</li>
          <li>Répondez directement depuis Decimal Inbox</li>
        </ul>
      </div>
    </div>
  )
}
