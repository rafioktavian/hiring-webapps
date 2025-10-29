import { getCandidatesByJobId, getJobById } from '@/lib/actions';
import { CandidateTable } from '@/components/admin/candidates/CandidateTable';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default async function CandidatesPage({ params }: any) {
  const { data: candidates, error: candidatesError } = await getCandidatesByJobId(params.id);
  const { data: job, error: jobError } = await getJobById(params.id);

  if (candidatesError || jobError) {
    return (
      <div className="container py-10">
        <p className="text-destructive">
          Could not load candidates: {candidatesError?.message || jobError?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{job?.title}</h1>
      </div>
      <CandidateTable candidates={candidates || []} jobTitle={job?.title || 'job'} />
    </div>
  );
}
