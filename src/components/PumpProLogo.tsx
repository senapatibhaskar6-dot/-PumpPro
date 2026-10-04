import React, { useState } from 'react';
import logoAsset from '../assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'compact';
  theme?: 'dark' | 'light' | 'print';
  className?: string;
}

export const PumpProLogo: React.FC<LogoProps> = ({
  size = 'md',
  theme = 'dark',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Height and max-width scaling for the 2048x768 wide brand logo
  const sizeMap = {
    sm: 'h-10 sm:h-11 max-w-[130px] sm:max-w-[150px]',
    md: 'h-12 sm:h-14 max-w-[160px] sm:max-w-[190px]',
    lg: 'h-14 sm:h-16 max-w-[200px] sm:max-w-[240px]',
    xl: 'h-18 sm:h-20 max-w-[260px] sm:max-w-[300px]',
  };

  const currentSizeClass = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* Prominent High-Resolution Brand Logo */}
      <div className="relative flex-shrink-0 group">
        <div
          className={`relative ${currentSizeClass} rounded-xl overflow-hidden shadow-lg border transition-all duration-300 group-hover:scale-105 flex items-center justify-center ${
            theme === 'light'
              ? 'bg-white border-slate-200 shadow-slate-200/50'
              : 'bg-slate-900/90 border-slate-700/80 shadow-black/50'
          }`}
        >
          {!imgError ? (
            <img
              src={logoAsset || '/logo.png'}
              alt="PumpPro Logo"
              className="w-full h-full object-contain p-1 sm:p-1.5"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black text-orange-500 bg-slate-900 text-sm px-4">
              PUMP PRO
            </div>
          )}
        </div>

        {/* Ambient Glow behind the logo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-sky-500/25 rounded-2xl blur-md -z-10 opacity-75 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};


