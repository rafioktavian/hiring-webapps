import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

// Create a separate admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);


export async function POST(request: Request) {
  const { fullName, email, password } = await request.json();
  
  // First, check if the requesting user is a super_admin
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // If super_admin, proceed to create the user
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.error('Error creating admin user:', createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }
  
  if (newUser.user) {
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: newUser.user.id,
        full_name: fullName,
        email: email,
        role: 'admin',
      },
      {
        onConflict: 'id',
      }
    );

    if (profileError) {
        console.error('Error creating admin profile:', profileError);
        // If profile creation fails, delete the created user to avoid orphaned auth users
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Admin user created successfully' });
}
