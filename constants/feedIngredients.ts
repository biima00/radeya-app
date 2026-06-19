export interface FeedIngredient {
  id: string;
  nama: string;
  kat: 'energi' | 'protein' | 'mineral' | 'aditif';
  em: number;
  pk: number;
  lk: number;
  sk: number;
  ca: number | null;
  p: number | null;
  maks: number | null;
  catatan: string;
}

export const FEED_INGREDIENTS: FeedIngredient[] = [
  // === SUMBER ENERGI ===
  { id: 'jagung',     nama: 'Jagung Giling',      kat: 'energi',
    em: 3350, pk: 8.7, lk: 3.9, sk: 2.0, ca: 0.02, p: 0.30,
    maks: null, catatan: 'Energi utama, kuning = vit A' },
  { id: 'dedak',      nama: 'Dedak Padi',          kat: 'energi',
    em: 1630, pk: 10.0, lk: 13.0, sk: 8.0, ca: 0.04, p: 1.40,
    maks: 30,  catatan: 'Murah, cepat tengik, batasi <30%' },
  { id: 'pollard',    nama: 'Pollard (Bran Gandum)',kat: 'energi',
    em: 1140, pk: 16.9, lk: 5.1, sk: 8.1, ca: null, p: null,
    maks: 20,  catatan: 'Serat sedang' },
  { id: 'onggok',     nama: 'Onggok (Ampas Singkong)',kat: 'energi',
    em: 2500, pk: 2.0, lk: 0.5, sk: 15.0, ca: null, p: null,
    maks: 15,  catatan: 'Energi murah, protein nol, serat tinggi' },
  { id: 'singkong',   nama: 'Singkong/Gaplek',     kat: 'energi',
    em: 3000, pk: 2.5, lk: 0.7, sk: 4.0, ca: null, p: null,
    maks: 20,  catatan: 'Karbohidrat tinggi' },

  // === SUMBER PROTEIN ===
  { id: 'tpung_ikan', nama: 'Tepung Ikan',         kat: 'protein',
    em: 2970, pk: 50.0, lk: 8.0, sk: 1.0, ca: 5.50, p: 2.80,
    maks: 10,  catatan: 'Protein hewani terbaik, mahal' },
  { id: 'bk_kedelai', nama: 'Bungkil Kedelai',     kat: 'protein',
    em: 2380, pk: 44.0, lk: 3.0, sk: 6.0, ca: 0.32, p: 0.67,
    maks: 30,  catatan: 'Protein nabati utama' },
  { id: 'bk_kelapa',  nama: 'Bungkil Kelapa',      kat: 'protein',
    em: 1540, pk: 21.0, lk: 15.0, sk: 15.0, ca: 0.20, p: 0.60,
    maks: 20,  catatan: 'Miskin sistein/histidin, lemak tinggi' },
  { id: 'ampas_tahu', nama: 'Ampas Tahu',           kat: 'protein',
    em: 2830, pk: 25.0, lk: 3.0, sk: 20.0, ca: 1.09, p: 0.80,
    maks: 15,  catatan: 'Murah lokal, kadar air tinggi, fermentasi dulu' },
  { id: 'tpung_keong',nama: 'Tepung Keong/Bekicot', kat: 'protein',
    em: 2800, pk: 52.0, lk: 5.0, sk: 2.0, ca: null, p: null,
    maks: 8,   catatan: 'Pengganti tepung ikan, lokal murah' },

  // === MINERAL & ADITIF ===
  { id: 'tpung_tulang',nama: 'Tepung Tulang',      kat: 'mineral',
    em: 0,    pk: 0,   lk: 0,   sk: 0,   ca: 30.0, p: 14.0,
    maks: 2,   catatan: 'Sumber Ca & P' },
  { id: 'kapur',      nama: 'Kapur/Limestone',     kat: 'mineral',
    em: 0,    pk: 0,   lk: 0,   sk: 0,   ca: 36.0, p: 0,
    maks: 2,   catatan: 'Kalsium cangkang telur' },
  { id: 'premix',     nama: 'Premix Vitamin-Mineral',kat: 'aditif',
    em: 0,    pk: 0,   lk: 0,   sk: 0,   ca: null, p: null,
    maks: 0.5, catatan: 'Mikrovitamin & mineral, 0.25–0.5%' },
  { id: 'minyak_nab', nama: 'Minyak Nabati',       kat: 'aditif',
    em: 8600, pk: 0,   lk: 99.0, sk: 0,   ca: 0,    p: 0,
    maks: 3,   catatan: 'Booster energi 1–3%' },
  { id: 'garam',      nama: 'Garam',               kat: 'aditif',
    em: 0,    pk: 0,   lk: 0,   sk: 0,   ca: null, p: null,
    maks: 0.5, catatan: 'Na, palatabilitas 0.3–0.5%' },
];
