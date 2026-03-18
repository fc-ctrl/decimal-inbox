# Changelog — Decimal Inbox

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et [Semantic Versioning](https://semver.org/lang/fr/).

---

## [0.1.0] — 2026-03-18

### Ajouté
- **Scaffold initial** : Vite + React 19 + TypeScript + Tailwind v4
- **Auth Supabase** : login/logout, protection des routes
- **Pages** : Inbox, Catégories, Paramètres, Login
- **Tables Supabase** : inbox_organizations, inbox_accounts, inbox_categories, inbox_routing_rules, inbox_threads, inbox_messages (toutes avec RLS)
- **Edge Function gmail-oauth** : flux OAuth2 complet (authorize → Google → callback → stocke tokens)
- **Edge Function gmail-sync** : synchronisation mails Gmail 24h, refresh tokens, auto-catégorisation
- **Settings** : bouton "Connecter Gmail" (OAuth2), bouton "Synchroniser", gestion comptes connectés
- **Déploiement** : Vercel (https://decimal-inbox.vercel.app)
- **Brain OS** : projet créé avec prompt système v1
