'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const navLinks = [
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin', label: 'Admin', icon: UserCog },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block font-headline">HiringFlow</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 transition-colors hover:text-foreground/80',
                  isActive ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end space-x-4">
          <Button asChild>
            <Link href="/admin/create-job">Create Job</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
