'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server';
import { Database } from '@/types/supabase';
import { z } from 'zod';

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
    details: {}, // Store extra fields here
  };
  
  // This part is a bit tricky without knowing all possible dynamic fields
  // A simple approach:
  const knownFields = ['job_id', 'full_name', 'email', 'phone_number', 'linkedin_link', 'domicile', 'gender', 'photo_profile_url'];
  formData.forEach((value, key) => {
    if (!knownFields.includes(key) && candidateData.details) {
      (candidateData.details as any)[key] = value;
    }
  });


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

  const filename = `${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, file);
  
  if (uploadError) {
    return handleError(uploadError, 'Failed to upload avatar');
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
  
  if (!urlData.publicUrl) {
    return { data: null, error: { message: 'Failed to get public URL for avatar' } };
  }

  return { data: { publicUrl: urlData.publicUrl }, error: null };
}
