# Creazio

Application React/TanStack Start mobile-first pour découvrir et réserver des ateliers créatifs en Île-de-France.

## Backend externe

Le schéma, les tables, l’authentification et les règles RLS seront créés ultérieurement dans un projet Supabase externe. L’interface actuelle n’insère aucune donnée de démonstration et n’utilise pas de stockage local persistant.

Lors du raccordement, prévoir sur Vercel les variables publiques `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, ainsi que leurs équivalents serveur si des fonctions serveur sont ajoutées. Une clé privilégiée ne doit jamais porter le préfixe `VITE_`.

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Crédits photo

Les photos des ateliers de démonstration (`public/ateliers/`) proviennent d'[Unsplash](https://unsplash.com) et sont utilisées sous la [licence Unsplash](https://unsplash.com/license) : utilisation libre, y compris commerciale, attribution non requise. Les noms des photographes n'ont pas été conservés lors du téléchargement.
