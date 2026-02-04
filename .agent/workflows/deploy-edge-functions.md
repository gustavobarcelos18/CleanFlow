---
description: How to deploy Supabase Edge Functions
---

# Deploy Edge Functions

To deploy the new `create-user` Edge Function, run the following command in your terminal:

```bash
npx supabase functions deploy create-user --no-verify-jwt
```

Or if you have the Supabase CLI installed globally:

```bash
supabase functions deploy create-user --no-verify-jwt
```

Note: You need to be logged in to Supabase CLI (`supabase login`) and linked to your project (`supabase link`).
