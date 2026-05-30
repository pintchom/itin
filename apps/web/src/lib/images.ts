export type CoverSize = 'lg' | 'sm';

const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? '';

export function coverImageUrl(key: string, size: CoverSize = 'lg'): string {
  return `${apiOrigin}/images/${encodeURIComponent(key)}/${size}`;
}

export const profileImageUrl = coverImageUrl;
