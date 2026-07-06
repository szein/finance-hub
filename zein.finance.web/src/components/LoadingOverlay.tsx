import React from 'react';
import { Spinner } from '@heroui/react';

interface LoadingOverlayProps {
  open: boolean;
  title: string;
  description?: string;
  fullscreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  open,
  title,
  description,
  fullscreen = true,
  className = '',
}: LoadingOverlayProps) {
  if (!open) return null;

  const positionClass = fullscreen ? 'fixed inset-0' : 'absolute inset-0';

  return (
    <div className={`${positionClass} z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-xl ring-1 ring-black/5">
        <Spinner size="lg" color="primary" />
        <div className="text-center">
          <p className="font-semibold text-default-900">{title}</p>
          {description && <p className="text-xs text-default-500">{description}</p>}
        </div>
      </div>
    </div>
  );
}
