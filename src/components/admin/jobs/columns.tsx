'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Job } from '@/types/supabase';
import { ArrowUpDown, MoreHorizontal, Users, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const getJobColumns = (
  onDelete: (job: Job) => void
): ColumnDef<Job>[] => [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      
      const variantClass = 
        status === 'active' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' :
        status === 'inactive' ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' :
        status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' :
        '';

      return <Badge variant="outline" className={cn('capitalize', variantClass)}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => {
      return format(new Date(row.getValue('created_at')), 'PP');
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const job = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href={`/admin/${job.id}/candidates`} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>View Candidates</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Job</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(job)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Job</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
