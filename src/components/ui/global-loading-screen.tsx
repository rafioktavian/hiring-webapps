'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function GlobalLoadingScreen() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Listen for navigation events
    const handleBeforeUnload = () => handleStart();
    const handleLoad = () => handleComplete();

    // Listen for link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
        handleStart();
      }
    };

    // Listen for form submissions
    const handleFormSubmit = () => handleStart();

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);
    document.addEventListener('click', handleLinkClick);
    document.addEventListener('submit', handleFormSubmit);

    // Complete loading after a delay
    const timer = setTimeout(() => {
      handleComplete();
    }, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
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
