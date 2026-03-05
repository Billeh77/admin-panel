'use client';

import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
};

export function SafeImage({ src, alt, className, fallback }: Props) {
  const [error, setError] = useState(false);

  if (error) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
