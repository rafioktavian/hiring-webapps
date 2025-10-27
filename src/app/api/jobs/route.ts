import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/server';

function slugify(text: string | null | undefined) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transformed = (data ?? []).map((job) => {
    const min = job.salary_min ?? undefined;
    const max = job.salary_max ?? undefined;
    const currency = job.salary_currency ?? 'IDR';

    let displayText = 'Salary info not specified';
    if (typeof min === 'number' && typeof max === 'number') {
      displayText = `${currencyFormatter.format(min)} - ${currencyFormatter.format(max)}`;
    } else if (typeof min === 'number') {
      displayText = `${currencyFormatter.format(min)}+`;
    } else if (typeof max === 'number') {
      displayText = `Up to ${currencyFormatter.format(max)}`;
    }

    let startedOnText = '';
    if (job.created_at) {
      const parsedDate = new Date(job.created_at);
      if (!Number.isNaN(parsedDate.getTime())) {
        startedOnText = `started on ${format(parsedDate, 'd MMM yyyy', { locale: enGB })}`;
      }
    }

    const status = job.status ?? 'draft';

    return {
      id: job.id,
      slug: slugify(job.title),
      title: job.title,
      status,
      salary_range: {
        min,
        max,
        currency,
        display_text: displayText,
      },
      list_card: {
        badge: status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Draft',
        started_on_text: startedOnText,
        cta: 'Manage Job',
      },
    };
  });

  return NextResponse.json({ data: transformed });
}
