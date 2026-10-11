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

- Keep backend access behind typed adapters because the user will create and connect the external Supabase schema later.
- Share one typed craft catalog across student interests, search, artisan expertise, and workshop forms to avoid category drift.
- Keep user-entered preview data in a root React context only until the external backend is connected; do not imply previews are persisted or authenticated.
- Keep artisan creation/editing and operational workshop details in dedicated routes and reuse the same form for both modes to preserve field consistency.
- Keep only `/` and `/devenir-artisan` public; all workshop, student, application, and artisan workspace screens are intended for authenticated users.
