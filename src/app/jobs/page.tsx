import { getJobs } from '@/lib/actions';
import { JobCard } from '@/components/jobs/JobCard';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function JobsPage() {
  const { data: jobs, error } = await getJobs();

  const activeJobs = jobs?.filter(job => job.status === 'active') || [];

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight">Find Your Next Opportunity</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Browse our open positions and start your journey with us today.
          </p>
        </div>

        {error && <p className="text-center text-destructive">Could not load jobs: {error.message}</p>}
        
        {!error && activeJobs.length === 0 && (
          <p className="text-center text-muted-foreground">No active job openings at the moment. Please check back later.</p>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {activeJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}
