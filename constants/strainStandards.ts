// Cobb 500 — standar per umur (as-hatched)
export const COBB500_STANDARD = [
  { hari: 7,  bb_g: 185,  adg_g: 28,  fcr: 1.01 },
  { hari: 14, bb_g: 465,  adg_g: 53,  fcr: 1.12 },
  { hari: 21, bb_g: 943,  adg_g: 78,  fcr: 1.28 },
  { hari: 28, bb_g: 1438, adg_g: 85,  fcr: 1.39 },
  { hari: 35, bb_g: 2191, adg_g: 99,  fcr: 1.55 },
  { hari: 42, bb_g: 2764, adg_g: 93,  fcr: 1.65 },
];

// Lohmann Brown — standar per fase umur (minggu)
export const LOHMANN_STANDARD = {
  puncak_hdp: 92,
  fcr_produksi: 2.15,
  berat_telur_g: 63,
  mortalitas_pct: 3,
};

// Kepadatan Standar per Spesies (Modul 10)
export const KEPADATAN_STANDAR: Record<string, { per_m2?: number | null; per_m3?: number | null; welfare?: number | null; satuan: string }> = {
  broiler_komersil:  { per_m2: 8,  satuan: 'ekor/m²', welfare: 6  },
  broiler_welfare:   { per_m2: 6,  satuan: 'ekor/m²', welfare: 5  },
  petelur_baterai:   { per_m2: null, satuan: 'ekor/kandang baterai', welfare: null },
  petelur_lantai:    { per_m2: 5,  satuan: 'ekor/m²', welfare: 4  },
  bebek_pedaging:    { per_m2: 5,  satuan: 'ekor/m²', welfare: 4  },
  bebek_petelur:     { per_m2: 4,  satuan: 'ekor/m²', welfare: 3  },
  kambing:           { per_m2: 0.8, satuan: 'ekor/m²', welfare: 0.67 }, // 1.25 m2/ekor -> 0.8 ekor/m2
  sapi:              { per_m2: 0.5, satuan: 'ekor/m²', welfare: 0.4  }, // 2 m2/ekor -> 0.5 ekor/m2
  lele_konvensional: { per_m3: 100, satuan: 'ekor/m³', welfare: 75  },
  lele_bioflok:      { per_m3: 250, satuan: 'ekor/m³', welfare: 200 },
  nila_konvensional: { per_m3: 25,  satuan: 'ekor/m³', welfare: 20  },
  nila_bioflok:      { per_m3: 100, satuan: 'ekor/m³', welfare: 80  },
};
