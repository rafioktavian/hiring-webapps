'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Listen for route changes
    handleStart();
    
    // Simulate loading time (you can adjust this)
    const timer = setTimeout(() => {
      handleComplete();
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
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
        
        {/* Loading Spinner */}
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-[#01959F]"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
