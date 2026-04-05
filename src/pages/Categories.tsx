import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { InboxCategory, RoutingRule } from '@/types'
import { Tag, Plus, Trash2, Save, Route, Bot } from 'lucide-react'

const defaultColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function Categories() {
  const [categories, setCategories] = useState<InboxCategory[]>([])
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editCat, setEditCat] = useState<Partial<InboxCategory> | null>(null)
  const [editRule, setEditRule] = useState<Partial<RoutingRule> | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: cats }, { data: rls }] = await Promise.all([
      supabase.from('inbox_categories').select('*').order('sort_order'),
      supabase.from('inbox_routing_rules').select('*').order('priority'),
    ])
    setCategories(cats || [])
    setRules(rls || [])
    setLoading(false)
  }

  async function saveCategory() {
    if (!editCat?.name) return
    if (editCat.id) {
      await supabase.from('inbox_categories').update({
        name: editCat.name,
        color: editCat.color,
        icon: editCat.icon,
        autoreply_enabled: editCat.autoreply_enabled ?? false,
        autoreply_prompt: editCat.autoreply_prompt ?? '',
        default_model: editCat.default_model ?? 'sonnet',
      }).eq('id', editCat.id)
    } else {
      await supabase.from('inbox_categories').insert({
        name: editCat.name,
        color: editCat.color || '#2563eb',
        icon: editCat.icon || 'tag',
        sort_order: categories.length,
        org_id: 'default',
        autoreply_enabled: editCat.autoreply_enabled ?? false,
        autoreply_prompt: editCat.autoreply_prompt ?? '',
        default_model: editCat.default_model ?? 'sonnet',
      })
    }
    setEditCat(null)
    await loadData()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Supprimer cette catégorie ?')) return
    await supabase.from('inbox_categories').delete().eq('id', id)
    await loadData()
  }

  async function saveRule() {
    if (!editRule?.match_value || !editRule?.category_id) return
    if (editRule.id) {
      await supabase.from('inbox_routing_rules').update({
        category_id: editRule.category_id,
        match_type: editRule.match_type,
        match_value: editRule.match_value,
      }).eq('id', editRule.id)
    } else {
      await supabase.from('inbox_routing_rules').insert({
        category_id: editRule.category_id,
        match_type: editRule.match_type || 'domain',
        match_value: editRule.match_value,
        priority: rules.length,
        org_id: 'default',
      })
    }
    setEditRule(null)
    await loadData()
  }

  async function deleteRule(id: string) {
    await supabase.from('inbox_routing_rules').delete().eq('id', id)
    await loadData()
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
      {/* Catégories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag size={20} />
            Catégories
          </h2>
          <button
            onClick={() => setEditCat({ name: '', color: '#2563eb', icon: 'tag', autoreply_enabled: false, autoreply_prompt: '', default_model: 'sonnet' })}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium">{cat.name}</span>
                {cat.autoreply_enabled && (
                  <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    <Bot size={10} />
                    Auto-reply
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditCat(cat)}
                  className="text-xs text-text-muted hover:text-primary"
                >
                  Modifier
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="text-text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="p-4 text-sm text-text-muted text-center">Aucune catégorie</p>
          )}
        </div>

        {/* Edit category modal */}
        {editCat && (
          <div className="mt-3 bg-white rounded-xl border border-border p-4 space-y-3">
            <input
              type="text"
              value={editCat.name || ''}
              onChange={e => setEditCat({ ...editCat, name: e.target.value })}
              placeholder="Nom de la catégorie"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <div className="flex gap-2">
              {defaultColors.map(c => (
                <button
                  key={c}
                  onClick={() => setEditCat({ ...editCat, color: c })}
                  className={`w-7 h-7 rounded-full border-2 ${editCat.color === c ? 'border-gray-800' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Auto-reply section */}
            <div className="border-t border-border pt-3">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={editCat.autoreply_enabled ?? false}
                  onChange={e => setEditCat({ ...editCat, autoreply_enabled: e.target.checked })}
                  className="rounded border-border"
                />
                <Bot size={14} className="text-purple-600" />
                <span className="text-sm font-medium">Activer la suggestion de réponse IA</span>
              </label>

              {/* Model selector */}
              <div className="mt-2">
                <label className="text-xs text-text-muted mb-1 block">Modèle IA par défaut</label>
                <select
                  value={editCat.default_model ?? 'sonnet'}
                  onChange={e => setEditCat({ ...editCat, default_model: e.target.value as 'haiku' | 'sonnet' | 'opus' })}
                  className="text-sm border border-border rounded-lg px-3 py-2"
                >
                  <option value="haiku">Haiku — rapide, orthographe, mails simples</option>
                  <option value="sonnet">Sonnet — recommandé, bon pour la plupart des mails</option>
                  <option value="opus">Opus — complexe, litiges, négociations</option>
                </select>
              </div>

              {editCat.autoreply_enabled && (
                <textarea
                  value={editCat.autoreply_prompt || ''}
                  onChange={e => setEditCat({ ...editCat, autoreply_prompt: e.target.value })}
                  placeholder={"Instructions pour l'IA. Exemples :\n- Ton amical et professionnel\n- Mentionner nos tarifs sur decimal.fr/pricing\n- Proposer un RDV via calendly.com/decimal\n- Signer \"Fabrice, Équipe Decimal\""}
                  rows={5}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditCat(null)} className="text-sm text-text-muted">Annuler</button>
              <button
                onClick={saveCategory}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover"
              >
                <Save size={14} />
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Règles de routage */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Route size={20} />
            Règles de routage automatique
          </h2>
          <button
            onClick={() => setEditRule({ match_type: 'domain', match_value: '', category_id: categories[0]?.id })}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {rules.map(rule => {
            const cat = categories.find(c => c.id === rule.category_id)
            return (
              <div key={rule.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rule.match_type}</span>
                  <span className="text-sm font-mono">{rule.match_value}</span>
                  <span className="text-text-muted text-xs">&rarr;</span>
                  {cat && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                      {cat.name}
                    </span>
                  )}
                </div>
                <button onClick={() => deleteRule(rule.id)} className="text-text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          {rules.length === 0 && (
            <p className="p-4 text-sm text-text-muted text-center">
              Aucune règle — les messages non routés seront classés par l'IA automatiquement
            </p>
          )}
        </div>

        {/* Edit rule */}
        {editRule && (
          <div className="mt-3 bg-white rounded-xl border border-border p-4 space-y-3">
            <div className="flex gap-2">
              <select
                value={editRule.match_type || 'domain'}
                onChange={e => setEditRule({ ...editRule, match_type: e.target.value as RoutingRule['match_type'] })}
                className="text-sm border border-border rounded-lg px-3 py-2"
              >
                <option value="domain">Domaine</option>
                <option value="from">Expéditeur</option>
                <option value="subject">Sujet contient</option>
                <option value="contains">Contient</option>
              </select>
              <input
                type="text"
                value={editRule.match_value || ''}
                onChange={e => setEditRule({ ...editRule, match_value: e.target.value })}
                placeholder={editRule.match_type === 'domain' ? 'cosy-groupe.com' : editRule.match_type === 'subject' ? 'facture' : 'client@example.com'}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
            <select
              value={editRule.category_id || ''}
              onChange={e => setEditRule({ ...editRule, category_id: e.target.value })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setEditRule(null)} className="text-sm text-text-muted">Annuler</button>
              <button
                onClick={saveRule}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover"
              >
                <Save size={14} />
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info IA */}
      <div className="mt-8 bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
        <p className="font-medium mb-1 flex items-center gap-1"><Bot size={14} /> Routage intelligent</p>
        <ul className="list-disc ml-4 space-y-1 text-xs">
          <li>Les règles manuelles sont appliquées en priorité</li>
          <li>Les messages sans règle sont classés automatiquement par l'IA (Claude)</li>
          <li>Activez "Suggestion de réponse IA" sur une catégorie pour recevoir des brouillons de réponse</li>
          <li>Les brouillons ne sont jamais envoyés sans votre validation</li>
        </ul>
      </div>
    </div>
  )
}
