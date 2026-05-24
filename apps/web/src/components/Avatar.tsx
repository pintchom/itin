import { cn } from '../lib/cn';

// Deterministic OKLCH color from a stable seed (userId). Same person always
// gets the same color across the app.
const PALETTE = [
  'oklch(0.62 0.16 30)',
  'oklch(0.62 0.16 60)',
  'oklch(0.6 0.15 130)',
  'oklch(0.6 0.15 200)',
  'oklch(0.6 0.18 260)',
  'oklch(0.62 0.18 300)',
  'oklch(0.65 0.16 330)',
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length] ?? 'oklch(0.6 0.16 260)';
}

function initialsOf(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim()[0] ?? '';
  const last = lastName?.trim()[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

export type AvatarSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  '2xs': 'h-4 w-4 text-[8px]',
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export type AvatarProps = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  size?: AvatarSize;
  ringClassName?: string;
};

export function Avatar({ userId, firstName, lastName, size = 'sm', ringClassName }: AvatarProps) {
  return (
    <span
      aria-label={[firstName, lastName].filter(Boolean).join(' ')}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0',
        SIZE_CLASSES[size],
        ringClassName
      )}
      style={{ backgroundColor: colorFor(userId) }}
    >
      {initialsOf(firstName, lastName)}
    </span>
  );
}
