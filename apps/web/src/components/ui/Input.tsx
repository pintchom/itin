import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import { cn } from '../../lib/cn';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-bg-elev px-3 text-base text-fg placeholder:text-fg-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactElement<{ id?: string }>;
}) {
  const generatedId = useId();
  const child = children;
  const childId = isValidElement(child) ? (child.props.id ?? generatedId) : generatedId;
  const control =
    isValidElement(child) && !child.props.id ? cloneElement(child, { id: childId }) : child;

  return (
    <div className="space-y-1.5">
      <label htmlFor={childId} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {control}
      {error ? (
        <span className="block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-fg-muted">{hint}</span>
      ) : null}
    </div>
  );
}
