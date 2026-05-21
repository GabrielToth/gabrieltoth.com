# Supabase CLI (link + schema)

## CLI login fails in the browser

If `npx supabase login` shows **"Unable to create CLI sign-in"**, use a personal access token instead:

1. Open [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Create a token (e.g. name: `cli-local`)
3. In PowerShell:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_your_token_here"
npx supabase login --token $env:SUPABASE_ACCESS_TOKEN
```

Or one line:

```powershell
npx supabase login --token sbp_your_token_here
```

## Link project and push schema

Project ref is in the dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Schema source: `supabase/schema.sql`.

## Alternative: run SQL in the dashboard

If the CLI is blocked, open **SQL Editor** in the Supabase dashboard and paste `supabase/schema.sql`.
