import { ReactNode } from 'react';

export function Alert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="alert" className={`border rounded-md p-4 bg-red-50 border-red-200 ${className || ''}`.trim()}>
      {children}
    </div>
  );
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <div className="text-sm text-red-800">{children}</div>;
}

