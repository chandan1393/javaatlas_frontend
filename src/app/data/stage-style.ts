/** A colour pair and a line icon (24×24 SVG path) for each stage. */
export const STAGE_STYLE: Record<string, { c1: string; c2: string; icon: string }> = {
  fundamentals: { c1: '#3355FF', c2: '#22D3EE', icon: 'M8 6 2 12l6 6M16 6l6 6-6 6' },
  oop: { c1: '#7C4DFF', c2: '#C084FC', icon: 'M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10' },
  core: { c1: '#0EA5E9', c2: '#6366F1', icon: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 18l10 5 10-5' },
  'hashmap-internals': { c1: '#14B8A6', c2: '#0EA5E9', icon: 'M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3zM7 6h.01M7 12h.01M7 18h.01' },
  'collections-compared': { c1: '#F43F5E', c2: '#A855F7', icon: 'M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4zM15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4zM12 2v20' },
  modern: { c1: '#F59E0B', c2: '#FF6B1A', icon: 'M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 17l-1.8-5.5L5 9.7l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z' },
  dsa: { c1: '#10B981', c2: '#14B8A6', icon: 'M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 9v3a3 3 0 0 0 3 3h6' },
  design: { c1: '#EC4899', c2: '#F97316', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
  tools: { c1: '#64748B', c2: '#0EA5E9', icon: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z' },
  concurrency: { c1: '#EAB308', c2: '#F97316', icon: 'M13 2 3 14h9l-1 8 10-12h-9z' },
  data: { c1: '#8B5CF6', c2: '#3355FF', icon: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3' },
  spring: { c1: '#6DB33F', c2: '#16A34A', icon: 'M11 20A7 7 0 0 1 4 13c0-5 4-9 16-10-1 12-5 16-9 17zM4 21c3-4 6-7 10-9' },
  boot: { c1: '#10B981', c2: '#84CC16', icon: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3-1 6-1 6-1s0 3-1 6c-1.5 4.5-6 8-6 8l-5-5s3.5-4.5 6-8zM9 12l3 3' },
  micro: { c1: '#06B6D4', c2: '#3B82F6', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
};

export const DEFAULT_STAGE_STYLE = STAGE_STYLE['fundamentals'];
