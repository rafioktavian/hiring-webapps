"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "./ui/button";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Briefcase, User, UserCog, UserPlus, ChevronRight } from "lucide-react";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const initials = (() => {
    if (!user?.email) return "HF";
    return user.email
      .split("@")[0]
      .split(/[._-]/)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  })();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const getLinks = () => {
    switch (role) {
      case "super_admin":
        return [{ href: "/super-admin/dashboard", label: "Dashboard", icon: UserCog }];
      case "admin":
        return [{ href: "/admin", label: "Jobs", icon: Briefcase }];
      case "candidate":
        return [
          { href: "/jobs", label: "Jobs", icon: Briefcase },
          { href: "/my-applications", label: "My Applications", icon: User },
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinks();
  const isCandidateDetailPage = pathname?.startsWith('/admin/') && pathname?.includes('/candidates');

  if (["/", "/login", "/register", "/super-admin/login"].includes(pathname)) {
    return null;
  }

  return (
    <>
    <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
        {isCandidateDetailPage ? (
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-white"
              >
                Job list
              </Link>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                Manage Candidate
              </span>
            </div>
          ) : (
            <Link href="/" className="text-2xl font-headline font-semibold text-primary">
            </Link>
          )
          }

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent transition-all hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl} alt={user.email ?? "User"} />
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold text-foreground">{user.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">{role?.replace("_", " ")}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(role === "super_admin" ? "/super-admin/dashboard" : "/admin")}
                    className="cursor-pointer text-sm"
                  >
                    View dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setIsLoggingOut(true);
                          await logout();
                        } finally {
                          // Keep overlay until route changes; fallback to hide after short delay
                          setTimeout(() => setIsLoggingOut(false), 1500);
                        }
                      }}
                      className="w-full cursor-pointer text-left text-sm text-destructive focus:text-destructive"
                    >
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link href="/login">
                    <UserCog className="mr-2 h-4 w-4" />
                    Admin Login
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Candidate Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    {isLoggingOut && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200"></div>
            <div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-[#01959F]"></div>
          </div>
          <p className="text-sm text-gray-600">Logging out...</p>
        </div>
      </div>
    )}
    </>
  );
}
