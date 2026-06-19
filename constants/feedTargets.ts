export interface FeedTarget {
  pk: number;
  em: number;
  label: string;
}

export const FEED_TARGETS: Record<string, FeedTarget> = {
  'broiler_starter':   { pk: 22, em: 3000, label: 'Broiler Starter (0–21 hr)' },
  'broiler_finisher':  { pk: 19, em: 3100, label: 'Broiler Finisher (22+ hr)' },
  'layer_produksi':    { pk: 17, em: 2750, label: 'Layer Produksi' },
  'bebek_pedaging':    { pk: 19, em: 2900, label: 'Bebek Pedaging' },
  'bebek_petelur':     { pk: 18, em: 2700, label: 'Bebek Petelur' },
  'lele_pembesaran':   { pk: 30, em: 2900, label: 'Lele Pembesaran' },
  'nila_pembesaran':   { pk: 28, em: 2800, label: 'Nila Pembesaran' },
  'sapi_penggemukan':  { pk: 14, em: 2600, label: 'Sapi Penggemukan' },
  'kambing_penggemukan':{ pk: 15, em: 2500, label: 'Kambing Penggemukan' },
};
