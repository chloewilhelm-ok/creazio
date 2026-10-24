<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep backend access behind typed adapters: generated `@/integrations/supabase/client` for reads/writes under RLS, `ensureProfile` in `src/lib/auth.ts` for post-signup profile creation (the user's Supabase schema has no signup trigger; pending data falls back to `user_metadata` on first sign-in).
- Share one typed craft catalog across student interests, search, artisan expertise, and workshop forms to avoid category drift; `savoirFaireByCategory` maps catalog categories to the Postgres `savoir_faire` enum.
- Generate dated sessions from artisan recurrence rules in database triggers using Europe/Paris; student availability reads actual future open sessions with remaining seats under RLS, never inferred recurrence dates, to preserve booking capacity and database pricing.
- Keep user-entered onboarding data (inspirations, addresses, artisan info, workshop drafts) in the `CreazioSessionProvider` context; persisted account data (profiles, packs, wallet) is read from Supabase.
- Keep artisan creation/editing and operational workshop details in dedicated routes and reuse the same form for both modes to preserve field consistency.
- Keep only `/`, `/devenir-artisan` and the password reset pages (`/mot-de-passe-oublie`, `/nouveau-mot-de-passe`, which Supabase opens with a recovery session) public; guard protected routes with `requireSession(area, pathname)` in `beforeLoad` (layouts `ateliers`, `espace-eleve`, `artisan` — the latter skips `/artisan/connexion` and `/artisan/inscription` — plus reservation confirmation). The guard checks the role, not just the session: student pages for students, artisan pages for validated artisans, and an artisan whose application is pending only sees `/artisan/candidature-envoyee` (rules in `src/lib/roles.ts`). One email = one account = one role: logins refuse an account from the other space, and signups detect Supabase's fake success for an existing email (empty `identities`).
