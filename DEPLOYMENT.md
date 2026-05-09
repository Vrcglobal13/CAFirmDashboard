# CA Firm OS Deployment Checklist

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Enable Email auth in Supabase Auth.
4. Add your production URL to Supabase Auth redirect URLs:
   - `https://your-domain.example/auth/callback`
   - `https://your-vercel-project.vercel.app/auth/callback`
5. Confirm Realtime is enabled for `tasks` and `notifications`.

## Vercel Environment Variables

Set these in Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Only the Supabase anon key is exposed to the browser. Do not add a service-role key to this app.

## Domain

1. Add the custom domain in Vercel.
2. Configure DNS records shown by Vercel.
3. Update `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
4. Add the final domain to Supabase Auth redirect URLs.

## Security

1. Verify RLS is enabled on every tenant table.
2. Keep service-role keys out of Vercel frontend/runtime env.
3. Review Vercel Firewall/WAF rules for production traffic.
4. Use HTTPS-only cookies and Supabase managed auth sessions.
