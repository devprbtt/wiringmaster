import type { ReactNode } from 'react';

type AlertProps = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'success';
};

export function Alert({ children, className, variant = 'default' }: AlertProps) {
  const variantClasses =
    variant === 'destructive'
      ? 'bg-red-50 border-red-200'
      : variant === 'success'
      ? 'bg-green-50 border-green-200'
      : 'bg-gray-50 border-gray-200';

  return (
    <div role="alert" className={`border rounded-md p-4 ${variantClasses} ${className || ''}`.trim()}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`text-sm ${className || 'text-red-800'}`.trim()}>{children}</div>;
}
