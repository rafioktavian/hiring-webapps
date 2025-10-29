'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [pathname]);

  return isLoading;
}

export function PageTransitionLoader() {
  const isLoading = usePageTransition();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image 
            src="/images/rakamin-logo.png" 
            alt="Rakamin" 
            width={120} 
            height={40}
            className="h-10 w-auto"
          />
        </div>
        
        {/* Loading Animation */}
        <div className="flex flex-col items-center space-y-4">
          {/* Spinning Circle */}
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200"></div>
            <div className="absolute top-0 left-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#01959F]"></div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Memuat halaman...</p>
            <p className="text-xs text-gray-500 mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      </div>
    </div>
  );
}