import { CreateJobForm } from '@/components/admin/jobs/CreateJobForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CreateJobPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Jobs
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Create a New Job Posting</h1>
            <p className="text-muted-foreground">Fill in the details for the new role and configure the application form.</p>
        </div>
        <CreateJobForm />
      </div>
    </div>
  );
}
