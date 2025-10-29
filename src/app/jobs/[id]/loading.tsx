import Image from 'next/image';

export default function JobDetailsLoading() {
  return (
    <div className="bg-[#f6f8fa] min-h-screen py-10">
      <div className="container mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-center p-20">
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
                  <p className="text-sm font-medium text-gray-700">Memuat detail lowongan...</p>
                  <p className="text-xs text-gray-500 mt-1">Menyiapkan informasi lengkap</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
