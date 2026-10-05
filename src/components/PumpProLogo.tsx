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
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Scaled height for natural wide aspect ratio (2048x768 = ~2.67:1 ratio)
  // Generous, large and clear sizing without dark box or padding
  const sizeMap = {
    sm: 'h-11 sm:h-12 max-w-[190px] sm:max-w-[210px]',
    md: 'h-14 sm:h-16 max-w-[230px] sm:max-w-[270px]',
    lg: 'h-16 sm:h-20 max-w-[280px] sm:max-w-[340px]',
    xl: 'h-20 sm:h-24 max-w-[340px] sm:max-w-[420px]',
  };

  const currentSizeClass = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none cursor-pointer ${className}`}>
      {!imgError ? (
        <img
          src={logoAsset || '/logo.png'}
          alt="PumpPro Petrol Pump Management"
          className={`${currentSizeClass} w-auto object-contain transition-transform duration-200 hover:scale-[1.03] drop-shadow-md`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-400 via-amber-400 to-sky-400 bg-clip-text text-transparent tracking-tight">
            PUMP PRO
          </span>
        </div>
      )}
    </div>
  );
};



