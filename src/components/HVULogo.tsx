import React from 'react';

interface HVULogoProps {
  className?: string;
  size?: number;
}

export const HVULogo: React.FC<HVULogoProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <img
      src="/hvu-logo.png"
      alt="Trường Đại học Hùng Vương - Hung Vuong University Emblem"
      className={`shrink-0 object-contain select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      loading="eager"
    />
  );
};
