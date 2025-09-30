# Google Business Shared Account Implementation Playbook

This playbook captures every credential, database object, serverless function, and client module that powers the current Google Business Profile integration so the exact behavior can be reproduced in another application while impersonating `juan@jegantic.com` through a shared service account.

---

## 1. Credential Inventory

| Scope | Identifier | Current Value / Source | Purpose |
|-------|------------|------------------------|---------|
| Supabase project | Project reference | `eqgtvisxqjfntyhqkadj` | Required when provisioning migrations and edge functions. |
| Supabase project | URL | `https://eqgtvisxqjfntyhqkadj.supabase.co` | Base URL for REST, GraphQL, and storage endpoints. |
| Supabase project | Anon (publishable) key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ3R2aXN4cWpmbnR5aHFrYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTgyNjksImV4cCI6MjA1MDYzNDI2OX0.MKYnU807c015wYnHAFviHWlF07I5ucR2gc7eRsZL78w` | Bootstraps client SDKs. |
| Supabase project | Service role key | Injected as `SUPABASE_SERVICE_ROLE_KEY` (retrieve from Supabase settings) | Used by edge functions to bypass RLS and perform privileged queries. |
| Supabase auth | JWT secret | Managed by Supabase | Needed only if self-hosting the Supabase stack. |
| Google Workspace | Impersonated user | `juan@jegantic.com` | Target principal for domain-wide delegation. |
| Google Cloud | Service account email | Configure new service account (e.g., `google-business-shared@<project>.iam.gserviceaccount.com`) | Generates JWTs and access tokens. |
| Google Cloud | Service account private key | Store JSON key; surface fields as `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_TOKEN_URI` | Used to mint impersonated access tokens. |
| Google Cloud | OAuth client ID | Configure as `GOOGLE_CLIENT_ID` when legacy OAuth remains available | Required by helper functions that still exchange authorization codes. |
| Google Cloud | OAuth client secret | Configure as `GOOGLE_CLIENT_SECRET` | Used by token exchange and refresh utilities. |
| Google Cloud | OAuth scope | `https://www.googleapis.com/auth/business.manage` | Grants Business Profile read/write access. |

Populate the following runtime variables in Supabase Edge Function settings (or Netlify/Cloudflare Workers if you re-host):

```
SUPABASE_URL=https://eqgtvisxqjfntyhqkadj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account-email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_IMPERSONATED_USER=juan@jegantic.com
GOOGLE_CLIENT_ID=<legacy-oauth-client-id>
GOOGLE_CLIENT_SECRET=<legacy-oauth-client-secret>
```

---

## 2. Database Objects

Recreate the schema objects with the exact column names to keep the existing queries and edge functions functioning.

### 2.1 Businesses

```sql
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  venue_name public.venue_name null,
  google_place_id text null,
  google_business_account_id text null,
  location text null,
  current_rating numeric null,
  last_synced_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.2 Google Auth Tokens

```sql
create table public.google_auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.3 Reviews Cache

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  google_review_id text not null unique,
  author_name text not null,
  rating numeric not null,
  comment text null,
  photo_urls text[] null,
  create_time timestamptz not null,
  reply text null,
  reply_time timestamptz null,
  sync_status text null,
  google_sync_source boolean null,
  status public.review_status null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.4 Review Sync Logs

```sql
create table public.review_sync_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  successful boolean not null,
  error_message text null,
  reviews_fetched integer null,
  reviews_processed integer null,
  duration_ms integer null,
  created_at timestamptz not null default now()
);
```

Create supporting indexes to match production behavior:

```sql
create index idx_reviews_business_id on public.reviews(business_id);
create index idx_reviews_sync_status on public.reviews(sync_status);
create index idx_review_sync_logs_business_id on public.review_sync_logs(business_id);
create index idx_businesses_user_id on public.businesses(user_id);
```

---

## 3. Supabase Edge Functions

Deploy each function exactly as shown. Replace `fetch` scopes with service-account token retrieval as you migrate.

### 3.1 Shared CORS Helper

```ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### 3.2 Google Authorization URL Generator

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { redirectUrl } = await req.json();
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  if (!clientId) {
    throw new Error('OAuth configuration missing');
  }

  const finalRedirectUri = redirectUrl || 'https://desk.jegantic.com/auth/callback';
  const scopes = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ];

  const scope = encodeURIComponent(scopes.join(' '));
  const state = crypto.randomUUID();

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&state=${state}` +
    `&prompt=consent` +
    `&include_granted_scopes=true`;

  return new Response(
    JSON.stringify({ url: authUrl }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
});
```

### 3.3 OAuth Token Exchange

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCTION_URL = 'https://desk.jegantic.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { code } = await req.json();
  if (!code) {
    throw new Error('No authorization code provided in request body');
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('OAuth configuration is incomplete');
  }

  const redirectUri = `${PRODUCTION_URL}/auth/callback`;
  const tokenRequestBody = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    access_type: 'offline',
    prompt: 'consent'
  });

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenRequestBody,
  });

  const data = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange token');
  }

  const expiresIn = data.expires_in || 3600;
  const expiresAt = new Date(Date.now() + (expiresIn * 1000));

  return new Response(
    JSON.stringify({ data: { ...data, expires_at: expiresAt.toISOString() } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
});
```

### 3.4 Refresh Google Token

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { refresh_token } = await req.json();
  if (!refresh_token) {
    throw new Error('No refresh token provided');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to refresh token');
  }

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
});
```

### 3.5 Reviews Payload Provider

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid token');
    }

    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !googleToken) {
      throw new Error('No Google token found');
    }

    if (new Date(googleToken.expires_at) <= new Date()) {
      throw new Error('Google token expired');
    }

    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('google_place_id, name')
      .eq('user_id', user.id);

    if (businessError) {
      throw businessError;
    }

    return new Response(
      JSON.stringify({
        access_token: googleToken.access_token,
        businesses: businesses
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in reviews function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: (error as Error).message.includes('token') ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 3.6 Manual Sync Trigger

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verificationError } = await supabase.auth.getUser(token);

    if (verificationError || !user) {
      throw new Error('Invalid token');
    }

    const { businessId } = await req.json();

    if (!businessId) {
      throw new Error('Business ID is required');
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found or you do not have permission');
    }

    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ businessId })
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      throw new Error(`Failed to sync reviews: ${syncResponse.status} ${errorText}`);
    }

    const result = await syncResponse.json();

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manual-sync function:', error);

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### 3.7 Sync Reviews Worker

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseRating(rating: string | number): number {
  if (typeof rating === 'number') return rating;
  if (!isNaN(Number(rating))) return Number(rating);
  const ratingMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return ratingMap[rating] || 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    const { businessId } = await req.json();

    if (!businessId) {
      throw new Error('Business ID is required');
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, google_place_id, user_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`);
    }

    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token')
      .eq('user_id', business.user_id)
      .single();

    if (tokenError || !googleToken) {
      throw new Error(`Google token not found: ${tokenError?.message}`);
    }

    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${googleToken.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${errorText}`);
    }

    const accountsData = await accountsResponse.json();

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No Google Business accounts found');
    }

    const accountId = accountsData.accounts[0].name;
    const locationId = business.google_place_id.replace(/^locations\//, '');
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/reviews`;

    const reviewsResponse = await fetch(`${reviewsUrl}?pageSize=50`, {
      headers: {
        'Authorization': `Bearer ${googleToken.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!reviewsResponse.ok) {
      const errorText = await reviewsResponse.text();
      throw new Error(`Failed to fetch reviews: ${reviewsResponse.status} ${errorText}`);
    }

    const reviewsData = await reviewsResponse.json();
    const reviews = reviewsData.reviews || [];

    let processedCount = 0;

    for (const review of reviews) {
      try {
        const numericRating = parseRating(review.starRating);
        const { error } = await supabase
          .from('reviews')
          .upsert({
            google_review_id: review.reviewId,
            business_id: business.id,
            author_name: review.reviewer.displayName,
            rating: numericRating,
            comment: review.comment || null,
            create_time: new Date(review.createTime).toISOString(),
            reply: review.reviewReply?.comment || null,
            reply_time: review.reviewReply?.createTime ? new Date(review.reviewReply.createTime).toISOString() : null,
            photo_urls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || null,
            sync_status: 'synced',
            google_sync_source: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'google_review_id', ignoreDuplicates: false });

        if (!error) {
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing review ${review.reviewId}:`, error);
      }
    }

    await supabase
      .from('businesses')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', business.id);

    const duration = Date.now() - startTime;

    await supabase
      .from('review_sync_logs')
      .insert({
        business_id: business.id,
        successful: true,
        reviews_fetched: reviews.length,
        reviews_processed: processedCount,
        duration_ms: duration
      });

    return new Response(
      JSON.stringify({
        message: 'Reviews synced successfully',
        business: business.name,
        fetched: reviews.length,
        processed: processedCount,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-reviews function:', error);

    if (req.body) {
      try {
        const { businessId } = await req.json();
        if (businessId) {
          await supabase
            .from('review_sync_logs')
            .insert({
              business_id: businessId,
              successful: false,
              error_message: (error as Error).message,
              reviews_fetched: 0,
              reviews_processed: 0
            });
        }
      } catch (e) {
        console.error('Error logging sync failure:', e);
      }
    }

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### 3.8 Reply to Review

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verificationError } = await supabase.auth.getUser(token);

    if (verificationError || !user) {
      throw new Error('Invalid token');
    }

    const { reviewId, comment, placeId } = await req.json();

    if (!reviewId || !comment || !placeId) {
      throw new Error('Missing required parameters');
    }

    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !googleToken) {
      throw new Error('Google token not found');
    }

    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${googleToken.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!accountsResponse.ok) {
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No Google Business accounts found');
    }

    const accountId = accountsData.accounts[0].name;
    const cleanLocationId = placeId.replace(/^locations\//, '');
    const replyUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${cleanLocationId}/reviews/${reviewId}/reply`;

    const replyResponse = await fetch(replyUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${googleToken.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        comment: comment
      })
    });

    if (!replyResponse.ok) {
      const errorText = await replyResponse.text();
      throw new Error(`Failed to reply to review: ${replyResponse.status} ${errorText}`);
    }

    const replyData = await replyResponse.json();

    await supabase
      .from('reviews')
      .update({
        reply: comment,
        reply_time: new Date().toISOString(),
        sync_status: 'synced'
      })
      .eq('google_review_id', reviewId);

    return new Response(
      JSON.stringify({
        message: 'Reply submitted successfully',
        replyData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reply-to-review function:', error);

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

> **Service-account upgrade**: Replace direct calls that fetch per-user tokens with a helper that exchanges the service account JWT for an access token impersonating `juan@jegantic.com`. Cache the token and inject it into all Google API calls.

---

## 4. Client Integration Modules

### 4.1 Supabase Client Initialization

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://eqgtvisxqjfntyhqkadj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ3R2aXN4cWpmbnR5aHFrYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTgyNjksImV4cCI6MjA1MDYzNDI2OX0.MKYnU807c015wYnHAFviHWlF07I5ucR2gc7eRsZL78w';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

### 4.2 Google Connect Hook

```ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleGoogleConnect = async () => {
    try {
      setIsConnecting(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/business.manage',
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      });

      if (error) throw new Error(error.message || 'Failed to connect with Google');
      if (!data?.url) throw new Error('Invalid response from authentication service');

      window.location.href = data.url;
    } catch (error: any) {
      setIsConnecting(false);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: error.message || 'Failed to connect with Google Business Profile. Please try again.',
      });
    }
  };

  return { isConnecting, handleGoogleConnect };
};
```

### 4.3 OAuth Callback Handler

```ts
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState({ error: null as string | null, details: null as string | null });

  const handleCallback = async () => {
    try {
      const oauthError = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      if (oauthError) throw new Error(errorDescription || oauthError);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      if (!session) throw new Error('Authentication failed - no session found');

      if (!session.provider_token) throw new Error('No provider token received');
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      const { error: upsertError } = await supabase
        .from('google_auth_tokens')
        .upsert({
          user_id: session.user.id,
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token || '',
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'user_id', ignoreDuplicates: false });
      if (upsertError) throw new Error('Failed to store authentication tokens');

      toast({
        title: 'Successfully connected with Google',
        description: 'You can now manage your business reviews',
      });

      navigate('/businesses');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate with Google';
      setState({
        error: errorMessage,
        details: error.response ? JSON.stringify(error.response.data, null, 2) : null
      });
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: errorMessage,
      });
    }
  };

  return { error: state.error, details: state.details, handleCallback };
};
```

### 4.4 Auth Context

```ts
import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  googleAuthToken: { access_token: string; expires_at: string } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  googleAuthToken: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleAuthToken, setGoogleAuthToken] = useState<{ access_token: string; expires_at: string } | null>(null);
  const { toast } = useToast();

  const refreshGoogleToken = async (userId: string) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;
      const providerToken = currentSession.provider_refresh_token;
      if (!providerToken) return;

      const response = await supabase.functions.invoke('refresh-google-token', {
        body: { refresh_token: providerToken },
        headers: { Authorization: `Bearer ${currentSession.access_token}` }
      });
      if (response.error) throw new Error(response.error.message);

      const { access_token, expires_in } = response.data;
      const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('google_auth_tokens')
        .update({ access_token, expires_at, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (updateError) throw updateError;

      setGoogleAuthToken({ access_token, expires_at });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh Google authentication token',
      });
    }
  };

  const fetchGoogleToken = async (userId: string) => {
    try {
      const { data: tokens, error } = await supabase
        .from('google_auth_tokens')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch Google authentication token' });
        setGoogleAuthToken(null);
        return;
      }

      if (!tokens) {
        setGoogleAuthToken(null);
        return;
      }

      const expiresAt = new Date(tokens.expires_at);
      const fiveMinutes = 5 * 60 * 1000;
      if (expiresAt.getTime() - Date.now() < fiveMinutes) {
        await refreshGoogleToken(userId);
      } else {
        setGoogleAuthToken(tokens);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while fetching Google token',
      });
      setGoogleAuthToken(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchGoogleToken(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setIsLoading(false);
      if (!session) {
        setGoogleAuthToken(null);
      } else {
        fetchGoogleToken(session.user.id);
      }
    });

    const refreshInterval = setInterval(() => {
      if (session?.user) {
        fetchGoogleToken(session.user.id);
      }
    }, 4 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, googleAuthToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 4.5 Review Retrieval Hook and Processor

```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { processReviewData } from '@/utils/reviewProcessing';

export const useReviews = () => {
  const { toast } = useToast();
  const { session } = useAuth();

  return useInfiniteQuery({
    queryKey: ['reviews'],
    queryFn: async ({ pageParam, meta }) => {
      const forceSync = meta?.forceSync === true;
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as {
        data: { access_token: string; businesses: Array<{ id: string; name: string; google_place_id: string; }> } | null;
        error: Error | null;
      };
      if (reviewsError) throw reviewsError;
      if (!reviewsData?.businesses || reviewsData.businesses.length === 0) {
        return { reviews: [], businesses: [], hasNextPage: false };
      }

      const { reviews, errors, nextPageTokens } = await processReviewData(reviewsData, pageParam as Record<string, string>, forceSync);
      if (errors.length > 0) {
        toast({ title: 'Some reviews failed to load', description: errors.join('\n'), variant: 'destructive' });
      }

      return {
        reviews,
        businesses: reviewsData.businesses,
        hasNextPage: !!nextPageTokens && Object.keys(nextPageTokens).length > 0,
        nextPageTokens
      };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageTokens : undefined),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
```

```ts
import { supabase } from '@/integrations/supabase/client';
import { Review } from '@/types/review';

export const processReviewData = async (
  reviewsData: { access_token: string; businesses: Array<{ id: string; name: string; google_place_id: string; }> },
  pageTokens?: Record<string, string>,
  forceSync: boolean = false
): Promise<{ reviews: Review[]; errors: string[]; nextPageTokens?: Record<string, string> }> => {
  const errors: string[] = [];
  const reviews: Review[] = [];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session found');

  const businessIds = reviewsData.businesses.map(b => b.id);
  if (forceSync) {
    for (const business of reviewsData.businesses) {
      const { error: syncError } = await supabase.functions.invoke('manual-sync', {
        body: { businessId: business.id },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (syncError) {
        errors.push(`Failed to sync business ${business.name}: ${syncError.message}`);
      }
    }
  }

  let { data: cachedReviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .in('business_id', businessIds)
    .order('create_time', { ascending: false });
  if (reviewsError) {
    errors.push(`Failed to fetch reviews from cache: ${reviewsError.message}`);
    return { reviews, errors };
  }

  if (!cachedReviews || cachedReviews.length === 0) {
    for (const business of reviewsData.businesses) {
      const { error: syncError } = await supabase.functions.invoke('manual-sync', {
        body: { businessId: business.id },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (syncError) {
        errors.push(`Failed to sync business ${business.name}: ${syncError.message}`);
      }
    }

    const { data: freshReviews, error: freshError } = await supabase
      .from('reviews')
      .select('*')
      .in('business_id', businessIds)
      .order('create_time', { ascending: false });
    if (freshError) {
      errors.push(`Sync process failed: ${freshError.message}`);
      return { reviews, errors };
    }
    cachedReviews = freshReviews || [];
  }

  cachedReviews.forEach(review => {
    const businessInfo = reviewsData.businesses.find(b => b.id === review.business_id);
    reviews.push({
      id: review.google_review_id,
      authorName: review.author_name,
      rating: review.rating,
      comment: review.comment || '',
      createTime: review.create_time,
      photoUrls: review.photo_urls || [],
      reply: review.reply ? { comment: review.reply, createTime: review.reply_time || new Date().toISOString() } : undefined,
      venueName: businessInfo?.name || 'Unknown Venue',
      placeId: businessInfo?.google_place_id || '',
      syncStatus: review.sync_status as 'synced' | 'pending_reply_sync' | 'reply_sync_failed'
    });
  });

  return { reviews, errors };
};
```

### 4.6 Review Actions Hook

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useReviewActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session, googleAuthToken } = useAuth();

  const submitReply = useMutation({
    mutationFn: async ({ reviewId, comment, placeId }: { reviewId: string; comment: string; placeId: string; }) => {
      if (!googleAuthToken?.access_token) throw new Error('No Google access token available');
      if (!session) throw new Error('No session available');

      const response = await supabase.functions.invoke('reply-to-review', {
        body: { reviewId, comment, placeId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-google-token': googleAuthToken.access_token
        }
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Reply posted successfully', description: 'Your reply has been posted.' });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to post reply',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  return { submitReply };
};
```

---

## 5. End-to-End Migration Steps

1. **Provision Supabase project**: Initialize a new Supabase instance, set the project reference, and import the schema plus stored procedures required by the integration.
2. **Load schema**: Execute the SQL from section 2 to create tables and indexes. Import additional enums (`venue_name`, `review_status`) to match production metadata.
3. **Configure secrets**: Populate Supabase Edge Function environment variables with the values listed in section 1. Upload the service account JSON and set `GOOGLE_IMPERSONATED_USER=juan@jegantic.com`.
4. **Deploy edge functions**: Upload each TypeScript snippet from section 3. After migration to the service account helper, swap per-user token lookups with service-account token retrieval.
5. **Seed service-account cache**: Optionally insert a sentinel row (e.g., `user_id = 'shared-service-account'`) inside `google_auth_tokens` storing the shared access token for compatibility while client code is updated.
6. **Ship client modules**: Copy or import the client snippets from section 4 into the new application. Update routing and UI wrappers to call `useGoogleAuth`, `useOAuthCallback`, `AuthProvider`, and `useReviews`.
7. **Implement impersonation helper**: Create a shared utility that signs a JWT with `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, sets `sub=juan@jegantic.com`, requests the Business Profile scope, and exchanges it at `https://oauth2.googleapis.com/token`. Cache the resulting access token and inject it into every Google API call from sections 3 and 4.
8. **Validate review ingestion**: Connect with the shared account, import at least one business, run `manual-sync`, and verify rows appear in `reviews` and `review_sync_logs` with `successful=true`.
9. **Verify replies**: Post a reply through the UI, confirm `reply` and `reply_time` fields update, and check Google Business Profile for the new response.
10. **Monitor quotas**: Capture HTTP 429 responses in logs and enforce exponential backoff if you add batch syncing beyond the 50-review page size.

Following this blueprint reproduces the full Google Business Profile integration—including credentials, privileged functions, and client-side orchestration—so another application can operate entirely through the shared service account while impersonating `juan@jegantic.com`.
