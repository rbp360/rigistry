// Reverb image fetch helper. Uses Next server route to keep tokens server-side.

export type ReverbPhotoLinks = {
  large?: { href: string };
  full?: { href: string };
};

export interface ReverbListingHit {
  title: string;
  photos?: Array<{ _links?: ReverbPhotoLinks }>;
}

export interface ReverbSearchResponse {
  listings?: ReverbListingHit[];
}

// kept for potential future server-side query building
// function buildQuery(brand: string, model: string): string {
//   return encodeURIComponent(`${brand} ${model}`.trim());
// }

export async function fetchStockImageForBrandModel(brand: string, model: string, color?: string, pickIndex: number = 0): Promise<{ url: string | null; attribution?: string }> {
  if (!brand || !model) return { url: null };
  const params = new URLSearchParams({ brand, model });
  if (color && color.trim()) params.set('color', color.trim());
  if (pickIndex && pickIndex > 0) params.set('pick', String(pickIndex));
  const res = await fetch(`/api/stock-image?${params.toString()}`, { method: 'GET' });
  if (!res.ok) return { url: null };
  const data = await res.json() as { url?: string; attribution?: string };
  return { url: data.url ?? null, attribution: data.attribution };
}
