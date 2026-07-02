import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ParentUserRequest = {
  guardianEmail?: string;
  guardianName?: string;
  schoolName?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const temporaryPassword = () => {
  const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 10);
  return `Parent@${suffix}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: 'Supabase function secrets are not configured.' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const accessToken = authHeader.replace('Bearer ', '').trim();

  if (!accessToken) {
    return jsonResponse({ error: 'Missing authorization token.' }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid authorization token.' }, 401);
  }

  const { data: callerProfile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || callerProfile?.role !== 'admin') {
    return jsonResponse({ error: 'Only admins can create parent login accounts.' }, 403);
  }

  const body = (await req.json().catch(() => ({}))) as ParentUserRequest;
  const guardianEmail = body.guardianEmail?.trim().toLowerCase();
  const guardianName = body.guardianName?.trim() || 'Parent';
  const schoolName = body.schoolName?.trim() || 'Sunrise Public School';

  if (!guardianEmail || !guardianEmail.includes('@')) {
    return jsonResponse({ error: 'A valid guardian email is required.' }, 400);
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from('profiles')
    .select('id, email, role')
    .eq('email', guardianEmail)
    .maybeSingle();

  if (existingProfileError) {
    return jsonResponse({ error: existingProfileError.message }, 500);
  }

  if (existingProfile) {
    if (existingProfile.role !== 'parent') {
      return jsonResponse({ error: 'This email is already used by a non-parent account.' }, 409);
    }

    return jsonResponse({
      created: false,
      email: guardianEmail,
      temporaryPassword: null,
      message: 'Parent account already exists. Use the existing parent login.',
    });
  }

  const password = temporaryPassword();
  const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
    email: guardianEmail,
    password,
    email_confirm: true,
    user_metadata: { name: guardianName, role: 'parent' },
  });

  if (createUserError || !createdUser.user) {
    return jsonResponse({ error: createUserError?.message || 'Unable to create parent account.' }, 500);
  }

  const { error: insertProfileError } = await adminClient.from('profiles').upsert({
    id: createdUser.user.id,
    name: guardianName,
    email: guardianEmail,
    role: 'parent',
    school_name: schoolName,
  });

  if (insertProfileError) {
    return jsonResponse({ error: insertProfileError.message }, 500);
  }

  return jsonResponse({
    created: true,
    email: guardianEmail,
    temporaryPassword: password,
    message: 'Parent account created successfully.',
  });
});
