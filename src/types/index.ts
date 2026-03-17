export type Channel = 'gmail' | 'outlook' | 'sms'

export interface InboxAccount {
  id: string
  user_id: string
  org_id: string
  channel: Channel
  label: string           // ex: "Gmail Decimal-IA", "Outlook Cosy"
  email: string           // email address or phone number
  credentials: Record<string, string>  // tokens stored encrypted
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InboxCategory {
  id: string
  org_id: string
  name: string            // ex: "Pro", "Cosy", "Decimal", "Perso"
  color: string           // hex color
  icon: string            // lucide icon name
  sort_order: number
  created_at: string
}

export interface RoutingRule {
  id: string
  org_id: string
  category_id: string
  match_type: 'domain' | 'email' | 'contains'
  match_value: string     // ex: "cosy-groupe.com", "client@example.com"
  priority: number
  created_at: string
}

export interface InboxThread {
  id: string
  org_id: string
  account_id: string
  category_id: string | null
  channel: Channel
  subject: string
  snippet: string         // preview text
  from_name: string
  from_address: string
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  message_count: number
  last_message_at: string
  external_id: string     // Gmail/Outlook thread ID
  created_at: string
  updated_at: string
  // joined
  category?: InboxCategory
  account?: InboxAccount
}

export interface InboxMessage {
  id: string
  thread_id: string
  account_id: string
  channel: Channel
  direction: 'inbound' | 'outbound'
  from_name: string
  from_address: string
  to_addresses: string[]
  cc_addresses: string[]
  subject: string
  body_text: string
  body_html: string
  attachments: MessageAttachment[]
  external_id: string     // Gmail/Outlook message ID
  sent_at: string
  created_at: string
}

export interface MessageAttachment {
  filename: string
  mime_type: string
  size: number
  url?: string
}

export interface InboxOrganization {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
}
