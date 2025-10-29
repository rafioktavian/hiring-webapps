'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface PhoneNumberInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PhoneNumberInput({ 
  value = '', 
  onChange, 
  placeholder = '81XXXXXXXXXX',
  className = ''
}: PhoneNumberInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Default to Indonesia (+62)
  const countryCode = '+62';
  const flagSrc = '/images/ic-flag.svg'; // You'll need to add this image
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value;
    onChange(phoneValue);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-white border-b border-gray-300 rounded-lg px-3 py-3">
        {/* Flag and Country Code Section */}
        <div className="flex items-center gap-2 mr-3">
          <Image 
            src={flagSrc} 
            alt="Indonesia Flag" 
            width={20} 
            height={15}
            className="rounded-sm"
          />
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </div>
        
        {/* Separator */}
        <div className="w-px h-6 bg-gray-300 mr-3"></div>
        
        {/* Country Code */}
        <span className="text-gray-600 text-sm font-medium mr-2">
          {countryCode}
        </span>
        
        {/* Phone Number Input */}
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
