'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server';
import { Database } from '@/types/supabase';
import { z } from 'zod';
import { createClient as createSupabaseAdminClient, type SupabaseClient } from '@supabase/supabase-js';

// Helper function for error handling
function handleError(error: Error, message: string) {
  console.error(message, error);
  return { data: null, error: { message: error.message || 'An unexpected error occurred' } };
}

// ====== Job Actions ======

export async function getJobs() {
  const supabase = createClient();
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, 'Failed to fetch jobs');
  return { data, error: null };
}

export async function getJobById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
  if (error) return handleError(error, `Failed to fetch job with id ${id}`);
  return { data, error: null };
}

const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  department: z.string().min(1, 'Department is required'),
  salary_min: z.number().positive('Minimum salary must be positive'),
  salary_max: z.number().positive('Maximum salary must be positive'),
  status: z.enum(['active', 'inactive', 'draft']),
  application_form: z.any(),
});

const parseJobFormData = (formData: FormData) => ({
  title: formData.get('title'),
  department: formData.get('department'),
  salary_min: Number(formData.get('salary_min')),
  salary_max: Number(formData.get('salary_max')),
  status: formData.get('status'),
  application_form: JSON.parse(formData.get('application_form') as string),
});

export async function createJob(formData: FormData) {
  const supabase = createClient();
  const rawData = parseJobFormData(formData);

  const validation = CreateJobSchema.safeParse(rawData);
  if (!validation.success) {
    return { data: null, error: { message: 'Invalid form data', issues: validation.error.issues } };
  }

  const { error } = await supabase.from('jobs').insert([validation.data as Database['public']['Tables']['jobs']['Insert']]);
  if (error) return handleError(error, 'Failed to create job');

  revalidatePath('/admin');
  revalidatePath('/jobs');
  return { data: { message: 'Job created successfully' }, error: null };
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = createClient();
  const rawData = parseJobFormData(formData);

  const validation = CreateJobSchema.safeParse(rawData);
  if (!validation.success) {
    return { data: null, error: { message: 'Invalid form data', issues: validation.error.issues } };
  }

  const { error } = await supabase.from('jobs').update(validation.data).eq('id', id);
  if (error) return handleError(error, 'Failed to update job');

  revalidatePath('/admin');
  revalidatePath('/jobs');
  return { data: { message: 'Job updated successfully' }, error: null };
}

export async function deleteJob(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) return handleError(error, `Failed to delete job with id ${id}`);

  revalidatePath('/admin');
  revalidatePath('/jobs');
  return { data: { message: 'Job deleted successfully' }, error: null };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AVATAR_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || 'avatars';
let isAvatarBucketEnsured = false;
let adminSupabaseClient: SupabaseClient | null = null;

function getAdminSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!adminSupabaseClient) {
    adminSupabaseClient = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }

  return adminSupabaseClient;
}

async function ensureAvatarBucket(): Promise<void> {
  if (isAvatarBucketEnsured) return;
  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    console.warn('Supabase avatar bucket could not be ensured: missing configuration.');
    return;
  }

  try {
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets();

    if (listError) {
      console.error('Failed to list Supabase buckets', listError);
      return;
    }

    const exists = buckets?.some((bucket) => bucket.name === AVATAR_BUCKET);
    if (!exists) {
      const { error: createError } = await adminClient.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: '5242880', // 5MB
      });

      if (createError) {
        console.error('Failed to create avatar bucket', createError);
        return;
      }
    }

    isAvatarBucketEnsured = true;
  } catch (error) {
    console.error('Unexpected error ensuring avatar bucket', error);
  }
}

// ====== Candidate Actions ======

export async function getCandidatesByJobId(jobId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false });
  if (error) return handleError(error, `Failed to fetch candidates for job ${jobId}`);
  return { data, error: null };
}

const ApplyFormSchema = z.object({
  job_id: z.string().uuid(),
  full_name: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  linkedin_link: z.string().url().optional(),
  domicile: z.string().optional(),
  gender: z.string().optional(),
  photo_profile_url: z.string().url().optional(),
  // a flexible details object for any other dynamic fields
  details: z.record(z.any()).optional(),
});


export async function applyForJob(formData: FormData) {
  const supabase = createClient();
  const jobId = formData.get('job_id') as string;

  const candidateData: Database['public']['Tables']['candidates']['Insert'] = {
    job_id: jobId,
    full_name: formData.get('full_name') as string | undefined,
    email: formData.get('email') as string | undefined,
    phone_number: formData.get('phone_number') as string | undefined,
    linkedin_link: formData.get('linkedin_link') as string | undefined,
    domicile: formData.get('domicile') as string | undefined,
    gender: formData.get('gender') as string | undefined,
    photo_profile_url: formData.get('photo_profile_url') as string | undefined,
  };
  // Note: We intentionally avoid inserting 'details'
  // because some environments/tables may not have this column.


  const { error } = await supabase.from('candidates').insert([candidateData]);

  if (error) {
    return handleError(error, 'Failed to submit application');
  }

  revalidatePath(`/admin/${jobId}/candidates`);
  return { data: { message: 'Application submitted successfully!' }, error: null };
}


// ====== Storage Actions ======

export async function uploadAvatar(formData: FormData) {
  const supabase = createClient();
  const file = formData.get('file') as File;
  if (!file) {
    return { data: null, error: { message: 'No file provided' } };
  }

  await ensureAvatarBucket();

  const originalName = file.name ? file.name.toLowerCase() : 'capture.jpg';
  const sanitizedName = originalName.replace(/[^a-z0-9.]+/g, '-');
  const filename = `${Date.now()}-${sanitizedName}`;

  const adminClient = getAdminSupabaseClient();
  const storageClient = adminClient?.storage ?? supabase.storage;
  if (!adminClient) {
    console.warn('Avatar upload is using the anon Supabase client. Ensure storage RLS allows inserts or configure SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { error: uploadError } = await storageClient
    .from(AVATAR_BUCKET)
    .upload(filename, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) {
    // Surface more helpful message when bucket truly does not exist
    if (uploadError.message?.toLowerCase().includes('bucket not found')) {
      return {
        data: null,
        error: {
          message:
            'Storage bucket for avatars was not found. Please ask an administrator to create it or set NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET.',
        },
      };
    }
    if (uploadError.message?.toLowerCase().includes('row-level security')) {
      return {
        data: null,
        error: {
          message:
            'Upload blocked by Supabase row-level security. Configure storage policies to allow uploads or set SUPABASE_SERVICE_ROLE_KEY.',
        },
      };
    }
    return handleError(uploadError, 'Failed to upload avatar');
  }

  const { data: publicUrlData, error: publicUrlError } = storageClient.from(AVATAR_BUCKET).getPublicUrl(filename) as any;

  if (publicUrlError) {
    return {
      data: null,
      error: { message: publicUrlError.message || 'Failed to get public URL for avatar' },
    };
  }

  if (!publicUrlData || !publicUrlData.publicUrl) {
    return {
      data: null,
      error: { message: 'Failed to get public URL for avatar: public URL not found in data.' },
    };
  }

  return { data: { publicUrl: publicUrlData.publicUrl }, error: null };
}
