import { getJobById } from '@/lib/actions';
import { ApplyForm } from '@/components/jobs/ApplyForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function JobDetailsPage({ params }: any) {
  // Check if user is authenticated
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  const { data: job, error } = await getJobById(params.id);

  if (error || !job) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-destructive">Unable to load the job. Please try again later.</p>
        <Link href="/jobs" className="mt-4 inline-flex items-center text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f8fa] min-h-screen py-10">
      <div className="container mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
          <div className="mb-6 flex items-center justify-between p-8">
            <div className="flex">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-xl font-semibold text-slate-900 ml-3 mt-1">Apply {job.title} at {job.department || 'Our Company'}</h1>
            </div>
            <span className="text-xs text-slate-500">This field required to fill</span>
          </div>
          <ApplyForm job={job} />
        </div>
      </div>
    </div>
  );
}
