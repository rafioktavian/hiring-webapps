'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Candidate } from '@/types/supabase';
import { downloadAsCsv } from '@/lib/utils';
import { Download } from 'lucide-react';
import Image from 'next/image';

interface CandidateTableProps {
  candidates: Candidate[];
  jobTitle: string;
}

export function CandidateTable({ candidates, jobTitle }: CandidateTableProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const allSelected = useMemo(() => {
    if (!candidates.length) return false;
    return candidates.every((candidate) => selected[candidate.id]);
  }, [candidates, selected]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    candidates.forEach((candidate) => {
      next[candidate.id] = true;
    });
    setSelected(next);
  };

  const toggleSingle = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExport = () => {
    const dataToExport = candidates.map(c => ({
        full_name: c.full_name,
        email: c.email,
        phone_number: c.phone_number,
        gender: c.gender,
        domicile: c.domicile,
        linkedin_link: c.linkedin_link,
        applied_at: c.applied_at,
    }));
    downloadAsCsv(dataToExport, `candidates_${jobTitle.replace(/\s+/g, '_')}`);
  }

  if (!candidates.length) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-md space-y-6">
            <Image
              src="/images/empty-candidates.svg"
              alt="No candidates illustration"
              width={280}
              height={200}
              className="mx-auto h-auto w-full max-w-xs"
              priority
            />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">No candidates found</h3>
              <p className="text-sm text-slate-500">
                Share your job vacancies so that more candidates will apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="border rounded-lg">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md m-4">
        <div className="min-w-full overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border border-[#01959F] accent-[#01959F] focus:ring-[#01959F]"
                    aria-label="Select all candidates"
                  />
                </th>
                <th className="px-1 py-4 text-slate-600">Nama Lengkap</th>
                <th className="px-6 py-4 text-slate-600">Email Address</th>
                <th className="px-6 py-4 text-slate-600">Phone Numbers</th>
                <th className="px-6 py-4 text-slate-600">Gender</th>
                <th className="px-6 py-4 text-slate-600">Domicile</th>
                <th className="px-6 py-4 text-slate-600">LinkedIn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {candidates.length ? (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={!!selected[candidate.id]}
                        onChange={() => toggleSingle(candidate.id)}
                        className="h-4 w-4 rounded border border-[#01959F] accent-[#01959F] focus:ring-[#01959F]"
                        aria-label={`Select ${candidate.full_name}`}
                      />
                    </td>
                    <td className="px-1 py-4 font-medium text-slate-700">{candidate.full_name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <a href={`mailto:${candidate.email}`} className="hover:underline">
                        {candidate.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{candidate.phone_number || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{candidate.gender || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{candidate.domicile || '—'}</td>
                    <td className="px-6 py-4 text-primary">
                      {candidate.linkedin_link ? (
                        <a
                          href={candidate.linkedin_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {candidate.linkedin_link}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No candidates found for this job.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
