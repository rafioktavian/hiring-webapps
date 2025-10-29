"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, WalletCards } from "lucide-react";
import type { Job } from "@/types/supabase";
import { Button } from "@/components/ui/button";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const getMetaFromJob = (job: Job) => {
  const meta = ((job.application_form as any)?.meta) ?? {};
  return {
    jobType: (meta.jobTypeLabel as string) || "Full-Time",
    jobDescription: (meta.jobDescription as string) || "",
    candidatesNeeded: meta.candidatesNeeded as number | undefined,
  };
};

const formatSalaryRange = (job: Job) => {
  const min = job.salary_min;
  const max = job.salary_max;
  if (typeof min === "number" && typeof max === "number") {
    return `${currencyFormatter.format(min)} - ${currencyFormatter.format(max)}`;
  }
  if (typeof min === "number") return `${currencyFormatter.format(min)}+`;
  if (typeof max === "number") return `Up to ${currencyFormatter.format(max)}`;
  return "Salary info not specified";
};

interface CandidateJobBoardProps {
  jobs: Job[];
}

export function CandidateJobBoard({ jobs }: CandidateJobBoardProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const selectedJob = useMemo(() => {
    if (!jobs.length || !selectedJobId) return null;
    return jobs.find((job) => job.id === selectedJobId) ?? null;
  }, [jobs, selectedJobId]);

  if (!jobs.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-600">No active job openings right now.</p>
        <p className="text-sm text-slate-500">Please check back later.</p>
      </div>
    );
  }

  const selectedMeta = selectedJob ? getMetaFromJob(selectedJob) : null;
  const descriptionPoints = selectedMeta?.jobDescription
    ? selectedMeta.jobDescription.split(/\n|•/).map((line) => line.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="w-full space-y-3 lg:w-1/3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 max-h-[70vh] overflow-auto pr-1">
            {jobs.map((job) => {
              const isActive = job.id === selectedJob?.id;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    isActive
                      ? "border-[#01959F] bg-[#F0FAFB] shadow"
                      : "border-slate-200 bg-white hover:border-[#01959F]/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#01959F]/10 text-[#01959F] font-semibold">
                      {job.title?.charAt(0) ?? "J"}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.department || "Our Company"}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#01959F]" />
                      <span>{job.department || 'Jakarta'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <WalletCards className="h-4 w-4 text-[#01959F]" />
                      <span>{formatSalaryRange(job)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedJob ? (
        <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#01959F]/10 text-[#01959F] font-semibold">
                {selectedJob.title?.charAt(0) ?? "J"}
              </div>
              <div>
                {selectedMeta?.jobType && (
                  <span className="mb-1 inline-flex rounded-full bg-[#01959F]/10 px-3 py-1 text-xs font-semibold text-[#01959F]">
                    {selectedMeta.jobType}
                  </span>
                )}
                <h2 className="text-2xl font-semibold text-slate-900">{selectedJob.title}</h2>
                <p className="text-sm text-slate-500">{selectedJob.department || "Our Company"}</p>
              </div>
            </div>
            <Button asChild className="rounded-full bg-amber-400 text-slate-900 hover:bg-amber-500">
              <Link href={`/jobs/${selectedJob.id}`}>Apply</Link>
            </Button>
          </div>

          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {descriptionPoints.length ? (
              <ul className="list-disc space-y-2 pl-5">
                {descriptionPoints.map((point, idx) => (
                  <li key={`${point}-${idx}`}>{point}</li>
                ))}
              </ul>
            ) : (
              <p>No description provided for this role yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-700">Select a job to view the details.</p>
          <p className="mt-2 text-sm text-slate-500">
            Choose a position from the list to see the full description and apply.
          </p>
        </div>
      )}
    </div>
  );
}
