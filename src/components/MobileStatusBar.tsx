import React from 'react';

export const MobileStatusBar: React.FC = () => {
  return (
    <div 
      className="w-full shrink-0 select-none z-30 bg-[#070b08]"
      style={{
        height: 'max(26px, env(safe-area-inset-top, 26px))'
      }}
      aria-hidden="true"
    />
  );
};

