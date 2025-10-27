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
  const { userId } = await request.json();
  
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
  
  if (userId === '00000000-0000-0000-0000-000000000001') {
      return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
  }

  // If super_admin, proceed to delete the user
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error('Error deleting admin user:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // The profile will be deleted automatically due to foreign key cascade on the 'profiles' table.

  return NextResponse.json({ message: 'Admin user deleted successfully' });
}
