# Decimal Inbox

## Projet
Inbox unifiée multi-canal (Gmail, Outlook, SMS) — multi-tenant, vendable via Decimal.

## Stack
- Vite + React 19 + TypeScript + Tailwind v4
- Supabase partagé (`plbjafwltwpupspmlnip`) — tables préfixées `inbox_*`
- Vercel : https://decimal-inbox.vercel.app
- Edge Functions Supabase : gmail-oauth, gmail-sync

## Conventions
- Tables Supabase préfixées `inbox_*`
- Multi-tenant : toujours `org_id` sur les tables
- Auth : Supabase Auth partagé avec les autres apps Cosy
- TypeScript strict : `tsc -b --noEmit` doit passer avant chaque push
- Pousser sur GitHub après chaque changement significatif

## Credentials
- Supabase URL : `https://plbjafwltwpupspmlnip.supabase.co`
- Anon key : en variable d'env Vercel
- Google OAuth : secrets Supabase (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
