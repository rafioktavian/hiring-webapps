'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Candidate } from '@/types/supabase';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const candidateColumns: ColumnDef<Candidate>[] = [
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const candidate = row.original;
        const initials = candidate.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('') || '??';

        return (
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={candidate.photo_profile_url || undefined} alt={candidate.full_name || ''} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{candidate.full_name}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({row}) => <a href={`mailto:${row.getValue('email')}`} className="hover:underline">{row.getValue('email')}</a>
  },
  {
    accessorKey: 'phone_number',
    header: 'Phone',
  },
  {
    accessorKey: 'gender',
    header: 'Gender',
  },
  {
    accessorKey: 'domicile',
    header: 'Domicile',
  },
  {
    accessorKey: 'linkedin_link',
    header: 'LinkedIn',
    cell: ({row}) => {
        const link = row.getValue('linkedin_link') as string;
        if (!link) return 'N/A';
        return <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Profile</a>
    }
  },
  {
    accessorKey: 'applied_at',
    header: 'Applied At',
    cell: ({ row }) => {
      const value = row.getValue('applied_at') as string | undefined;
      if (!value) return 'N/A';
      return format(new Date(value), 'PPp');
    },
  },
];
