import { ImagePlus } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { ApiError } from '../lib/api';
import { cn } from '../lib/cn';
import { coverImageUrl } from '../lib/images';

export type ImageUploadProps = {
  value: string | null;
  onChange: (key: string | null) => void;
  label?: string;
  disabled?: boolean;
  /** `cover` = 16:9 party cover; `square` = profile avatar */
  aspect?: 'cover' | 'square';
};

export function ImageUpload({
  value,
  onChange,
  label = 'Cover image',
  disabled,
  aspect = 'cover',
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = () => inputRef.current?.click();

  const onFiles = async (files: FileList | null) => {
    setError(null);
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/images', {
        method: 'POST',
        body,
        credentials: 'include',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new ApiError(res.status, 'upload_failed', data?.error?.message ?? 'Upload failed');
      }
      const { key } = (await res.json()) as { key: string };
      onChange(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-fg">{label}</span>
      <button
        type="button"
        onClick={onPick}
        disabled={disabled || uploading}
        aria-describedby={inputId}
        className={cn(
          'relative w-full overflow-hidden border border-border bg-bg-elev flex items-center justify-center text-fg-muted disabled:opacity-50',
          aspect === 'square'
            ? 'aspect-square max-w-[200px] mx-auto rounded-full'
            : 'aspect-[16/9] rounded-2xl'
        )}
      >
        {value ? (
          <img
            src={coverImageUrl(value, 'lg')}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-4 text-center">
            <ImagePlus className="h-7 w-7" />
            <span className="text-sm">
              {uploading ? 'Uploading…' : 'Tap to choose a landscape image'}
            </span>
          </div>
        )}
        {value && !uploading && (
          <span className="absolute right-3 bottom-3 rounded-lg bg-black/55 px-2 py-1 text-xs text-white">
            Change
          </span>
        )}
      </button>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && <span className="block text-xs text-danger">{error}</span>}
    </div>
  );
}
