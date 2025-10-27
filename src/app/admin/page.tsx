'use client';
import { getJobs } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Job } from '@/types/supabase';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateJobForm } from '@/components/admin/jobs/CreateJobForm';

export default function AdminDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [jobBeingEdited, setJobBeingEdited] = useState<Job | null>(null);
  const { user, role, logout } = useAuth();

  const initials = useMemo(() => {
    if (!user?.email) return 'HF';
    return user.email
      .split('@')[0]
      .split(/[._-]/)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.email]);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: jobsError } = await getJobs();
      if (jobsError) {
        throw new Error(jobsError.message);
      }
      setJobs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);
  
  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const hasJobs = jobs.length > 0;
  const hasResults = filteredJobs.length > 0;

  const formatSalaryRange = (min?: number | null, max?: number | null) => {
    if (!min || !max) {
      return 'Salary info not specified';
    }
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const formatStartDate = (date?: string | null) => {
    if (!date) return 'start date unavailable';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'start date unavailable';
    return `started on ${format(parsed, 'd MMM yyyy')}`;
  };

  const getStatusBadge = (status?: Job['status']) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        };
      case 'inactive':
        return {
          label: 'Inactive',
          className: 'bg-red-100 text-red-600 border border-red-200',
        };
      case 'draft':
      default:
        return {
          label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft',
          className: 'bg-amber-100 text-amber-700 border border-amber-200',
        };
    }
  };

  const handleOpenEditModal = (job: Job) => {
    setJobBeingEdited(job);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setJobBeingEdited(null);
  };

  return (
    <div className="container mx-auto py-10 space-y-6 md:space-y-10">
      <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex-1 md:max-w-4xl">
          <div className="relative rounded-2xl border border-input bg-white px-4 py-3 shadow-sm">
            <Input
              placeholder="Search by job details"
              className="border-none bg-transparent px-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="md:absolute md:right-0 w-80">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg md:top-1">
            <Image
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80"
              alt="Recruiting team brainstorming on a whiteboard"
              fill
              className="object-cover opacity-50"
              priority
            />
            <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wide text-white/70">Recruit the best candidates</p>
                <h2 className="text-base font-semibold leading-snug text-white">
                  Create jobs, invite, and hire with ease
                </h2>
              </div>
              <Button
                className="bg-white text-slate-900 hover:bg-white/90"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create a new job
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border bg-white/60 text-muted-foreground">
          Loading jobs...
        </div>
      ) : error ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/5 text-destructive">
          Error loading jobs: {error}
        </div>
      ) : !hasJobs ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-muted-foreground/40 bg-white px-6 py-16 text-center shadow-sm">
          <Image
            src="/images/empty-job-search.svg"
            alt="Illustration of recruiter holding magnifying glass with zero indicator"
            width={280}
            height={280}
            className="mb-10 h-auto max-w-xs"
            priority
          />
          <h2 className="text-2xl font-semibold">No job openings available</h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Create a job opening now and start the candidate process. We&apos;ll guide you through every step.
          </p>
          <Button
            className="mt-8 bg-amber-400 text-slate-900 hover:bg-amber-500"
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create a new job
          </Button>
        </div>
      ) : !hasResults ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-white px-6 py-16 text-center shadow-sm">
          <Image
            src="https://illustrations.popsy.co/blue/searching.svg"
            alt="Search not found illustration"
            width={280}
            height={200}
            className="mb-8"
          />
          <h2 className="text-xl font-semibold">No jobs match “{searchTerm}”</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Try updating your keywords or create a brand new job posting to kickstart your hiring pipeline.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear search
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create a new job
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 md:max-w-4xl">
          {filteredJobs.map((job) => {
            const badge = getStatusBadge(job.status);
            return (
              <div
                key={job.id}
                className="rounded-3xl border border-transparent bg-white p-6 shadow-sm transition-shadow hover:shadow-lg cursor-pointer"
                onClick={() => handleOpenEditModal(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenEditModal(job);
                  }
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {formatStartDate(job.created_at)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{formatSalaryRange(job.salary_min, job.salary_max)}</p>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="self-start rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 md:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/admin/${job.id}/candidates`}>Manage Job</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Job Opening</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <CreateJobForm
              onSuccess={async () => {
                setIsCreateModalOpen(false);
                await loadJobs();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditModalOpen} onOpenChange={(open) => (open ? setIsEditModalOpen(true) : handleCloseEditModal())}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {jobBeingEdited && (
              <CreateJobForm
                mode="edit"
                initialJob={jobBeingEdited}
                onSuccess={async () => {
                  handleCloseEditModal();
                  await loadJobs();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
