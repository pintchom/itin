export type CoverSize = 'lg' | 'sm';

export function coverImageUrl(key: string, size: CoverSize = 'lg'): string {
  return `/images/${encodeURIComponent(key)}/${size}`;
}

export const profileImageUrl = coverImageUrl;
