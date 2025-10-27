import Link from 'next/link';
import { Job } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min || !max) return 'Not specified';
    return `Rp${(min / 1000).toFixed(0)}k - Rp${(max / 1000).toFixed(0)}k`;
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{job.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-2">
            <Briefcase className="h-4 w-4" /> {job.department}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{formatSalary(job.salary_min, job.salary_max)}</Badge>
            <Badge variant="secondary">Full-time</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
            <Link href={`/jobs/${job.id}`}>View & Apply</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
