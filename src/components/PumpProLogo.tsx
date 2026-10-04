import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'compact';
  theme?: 'dark' | 'light' | 'print';
  className?: string;
}

export const PumpProLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'dark',
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 32, font: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 42, font: 'text-2xl', sub: 'text-[10px]' },
    lg: { icon: 54, font: 'text-3xl', sub: 'text-xs' },
    xl: { icon: 72, font: 'text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Intertwined 'PP' Monogram with Integrated Fuel Nozzle and Growth Arrow */}
      <div className="relative flex-shrink-0 group">
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
        >
          <defs>
            {/* Orange Energy Gradient for First 'P' */}
            <linearGradient id="ppOrangeGrad" x1="10" y1="20" x2="60" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* Deep Blue / Cyan Growth Gradient for Second 'P' & Arrow */}
            <linearGradient id="ppBlueGrad" x1="35" y1="15" x2="90" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            {/* Dark Shield / Rounded Base Container */}
            <linearGradient id="ppBgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            {/* Glowing Accent Filter */}
            <filter id="ppGlow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Rounded Hexagonal / Squircle Badge Background */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="url(#ppBgGrad)"
            stroke="#1e293b"
            strokeWidth="2.5"
          />

          {/* Subtle Fuel Flow Grid/Rays */}
          <circle cx="50" cy="50" r="38" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />

          {/* === INTERTWINED 'PP' MONOGRAM ARTWORK === */}
          {/* First 'P' (Fuel / Pump pillar in vibrant Orange) */}
          {/* Vertical Stem of First P with fuel dispenser nozzle handle contour */}
          <path
            d="M24 74V28C24 24.686 26.686 22 30 22H44C52.837 22 60 29.163 60 38C60 46.837 52.837 54 44 54H33V74"
            stroke="url(#ppOrangeGrad)"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Second 'P' (Management & Profit in Deep Blue / Cyan, intertwined behind & through first P) */}
          <path
            d="M45 74V42C45 38.686 47.686 36 51 36H65C73.837 36 81 43.163 81 52C81 60.837 73.837 68 65 68H54V74"
            stroke="url(#ppBlueGrad)"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />

          {/* Integrated Fuel Dispenser Nozzle detail at lower left stem */}
          {/* Nozzle hose curve looping around base of P */}
          <path
            d="M19 72C19 75 22 78 26 78H31"
            stroke="#fb923c"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Nozzle Spout Angle */}
          <path
            d="M19 63L14 57L17 54L22 60"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Fuel Drop Accent inside the loop of the First 'P' */}
          <path
            d="M43 32C43 32 48 38 48 40.5C48 43 45.8 45 43 45C40.2 45 38 43 38 40.5C38 38 43 32 43 32Z"
            fill="#f97316"
          />

          {/* Upward Growth Arrow smoothly originating from the Second 'P' loop top */}
          {/* Arrow Shaft extending up-right */}
          <path
            d="M66 32L84 14"
            stroke="url(#ppBlueGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Arrow Head */}
          <path
            d="M72 14H84V26"
            stroke="#38bdf8"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Tech Spark / Precision indicator dot */}
          <circle cx="84" cy="14" r="2.5" fill="#ffffff" filter="url(#ppGlow)" />
        </svg>

        {/* Ambient Glow behind the logo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-sky-500/20 to-blue-600/20 rounded-2xl blur-lg -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Typography Branding */}
      {variant !== 'icon' && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1 font-extrabold tracking-tight">
            <span
              className={`${currentSize.font} font-black tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Pump
            </span>
            <span
              className={`${currentSize.font} font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600`}
            >
              Pro
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block animate-pulse ml-0.5" />
          </div>

          {variant === 'full' && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`${currentSize.sub} font-bold tracking-widest uppercase ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Fuel & Lubricants System
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded">
                v2.4
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
