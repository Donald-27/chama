**Welcome to Chama Manager**

This project contains everything you need to run your Chama Manager app locally.

Getting started

1. Clone the repository and navigate to the project directory
2. Install dependencies: `npm install`
3. Create a `.env` file and set your Supabase environment variables (see below)

Example `.env` values:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-api-key>
```

Run the app locally:

```
npm run dev
```

Deploy notes

- When deploying (e.g., Netlify), be sure to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the site's build environment variables so they are available at build time.
- Configure OAuth provider redirect URIs in Supabase and the provider (Google/Apple) so auth flows work after deploy.

For provider setup see Supabase docs: https://supabase.com/docs/guides/auth
