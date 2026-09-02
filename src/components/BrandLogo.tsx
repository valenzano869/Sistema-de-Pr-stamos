import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'compact';
  theme?: 'dark' | 'light';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  theme = 'dark',
  className = 'h-10',
}) => {
  if (variant === 'icon') {
    return (
      <img
        src="/favicon.svg"
        alt="Préstamos Fácil Icon"
        className={`${className} object-contain rounded-xl shadow-xs`}
        referrerPolicy="no-referrer"
      />
    );
  }

  const logoSrc = theme === 'dark' ? '/logo-white.svg' : '/logo.svg';

  return (
    <img
      src={logoSrc}
      alt="Préstamos Fácil - Crédito Rápido y Sencillo"
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
    />
  );
};
