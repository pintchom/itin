import { Button } from './Button';

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex-1 flex items-center justify-center text-fg-muted">{label}</div>;
}

export function ErrorScreen({
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="px-6 text-center">
        <p className="text-danger">{message}</p>
        {onRetry && (
          <Button className="mt-4" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
