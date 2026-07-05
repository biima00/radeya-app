import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Animal labels mapping (local copy to avoid circular import from page.tsx)
const ANIMAL_LABELS: Record<string, string> = {
  broiler: '🐔 Ayam Pedaging',
  petelur: '🐔 Ayam Petelur',
  bebek_pedaging: '🦆 Bebek Pedaging',
  bebek_petelur: '🦆 Bebek Petelur',
  kambing_pedaging: '🐐 Kambing Pedaging',
  kambing_perah: '🐐 Kambing Perah',
  sapi_pedaging: '🐄 Sapi Pedaging',
  sapi_perah: '🐄 Sapi Perah',
  ikan_pembesaran: '🐟 Ikan Pembesaran',
  ikan_pembibitan: '🐟 Ikan Pembibitan',
  pembibitan_unggas: '🐣 Pembibitan Unggas',
  pembibitan_sapi: '🐄 Pembibitan Sapi',
  penggemukan: '🥩 Penggemukan',
  susu: '🥛 Sapi Perah (Susu)',
  breeding_ruminansia: '🐑 Breeding Ruminansia',
};

// Helper to format Rupiah
function formatRp(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
  if (isNaN(num)) return '—';
  if (num === 0) return 'Rp 0';
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(1)}rb`;
  return `Rp ${num.toFixed(0)}`;
}

// Helper to format percentage
function formatPct(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
  if (isNaN(num)) return '—';
  return `${num.toFixed(1)}%`;
}

// Helper to format number
function formatNum(value: number | string | null | undefined, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
  if (isNaN(num)) return '—';
  return num.toFixed(decimals);
}

// Summary config: maps mode to array of { key, label, fmt }
const MODE_SUMMARY_CONFIG: Record<string, Array<{ key: string; label: string; fmt: 'rp' | 'pct' | 'num' | 'days' }>> = {
  broiler: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'totalPendapatan', label: 'Total Pendapatan', fmt: 'rp' },
    { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
    { key: 'ebitda', label: 'EBITDA', fmt: 'rp' },
    { key: 'hpp', label: 'HPP / kg', fmt: 'rp' },
    { key: 'hppAkurat', label: 'HPP / kg (Akurat)', fmt: 'rp' },
    { key: 'fcr', label: 'FCR', fmt: 'num' },
    { key: 'srPct', label: 'Survival Rate', fmt: 'pct' },
    { key: 'ip', label: 'IP (Index Performa)', fmt: 'num' },
    { key: 'umur', label: 'Umur Panen', fmt: 'days' },
  ],
  petelur: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'totalPendapatan', label: 'Total Pendapatan', fmt: 'rp' },
    { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
    { key: 'hppButir', label: 'HPP / Butir', fmt: 'rp' },
    { key: 'hppButirAkurat', label: 'HPP / Butir (Akurat)', fmt: 'rp' },
    { key: 'hppKg', label: 'HPP / Kg', fmt: 'rp' },
    { key: 'hppKgAkurat', label: 'HPP / Kg (Akurat)', fmt: 'rp' },
    { key: 'henDay', label: 'Hen Day %', fmt: 'pct' },
    { key: 'fcrTelur', label: 'FCR Telur', fmt: 'num' },
    { key: 'totalButir', label: 'Total Butir', fmt: 'num' },
  ],
  ikan_pembesaran: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'totalPendapatan', label: 'Total Pendapatan', fmt: 'rp' },
    { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
    { key: 'hpp', label: 'HPP / kg', fmt: 'rp' },
    { key: 'hppAkurat', label: 'HPP / kg (Akurat)', fmt: 'rp' },
    { key: 'fcr', label: 'FCR', fmt: 'num' },
    { key: 'gapFCR', label: 'Gap FCR', fmt: 'num' },
    { key: 'gapSR', label: 'Gap SR %', fmt: 'num' },
    { key: 'bepHarga', label: 'BEP Harga', fmt: 'rp' },
    { key: 'srPct', label: 'Survival Rate', fmt: 'pct' },
  ],
  ikan_pembibitan: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'dayaTetas', label: 'Daya Tetas', fmt: 'pct' },
    { key: 'docMenetas', label: 'Larva Menetas', fmt: 'num' },
    { key: 'populasi', label: 'Populasi', fmt: 'num' },
    { key: 'gagalTetas', label: 'Gagal Tetas', fmt: 'pct' },
    { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
  ],
  pembibitan_unggas: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'dayaTetas', label: 'Daya Tetas', fmt: 'pct' },
    { key: 'docMenetas', label: 'DOC Menetas', fmt: 'num' },
    { key: 'populasi', label: 'Populasi Induk', fmt: 'num' },
    { key: 'iofc', label: 'IOFC', fmt: 'rp' },
    { key: 'margin', label: 'Margin', fmt: 'rp' },
    { key: 'hpp', label: 'HPP / DOC', fmt: 'rp' },
    { key: 'hppAkurat', label: 'HPP / DOC (Akurat)', fmt: 'rp' },
  ],
  penggemukan: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'totalPendapatan', label: 'Total Pendapatan', fmt: 'rp' },
    { key: 'iofc', label: 'IOFC', fmt: 'rp' },
    { key: 'margin', label: 'Margin', fmt: 'rp' },
    { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
  ],
  susu: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'totalPendapatan', label: 'Total Pendapatan', fmt: 'rp' },
    { key: 'hppLiter', label: 'HPP / Liter', fmt: 'rp' },
    { key: 'hppLiterAkurat', label: 'HPP / Liter (Akurat)', fmt: 'rp' },
    { key: 'produksiRata', label: 'Produksi Rata-rata/hari', fmt: 'num' },
    { key: 'fcrSusu', label: 'FCR Susu', fmt: 'num' },
    { key: 'FCM', label: 'FCM (4% Corrected)', fmt: 'num' },
    { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
  ],
  breeding_ruminansia: [
    { key: 'totalModal', label: 'Total Modal', fmt: 'rp' },
    { key: 'totalPendapatan', label: 'Total Pendapatan', fmt: 'rp' },
    { key: 'iofc', label: 'IOFC', fmt: 'rp' },
    { key: 'margin', label: 'Margin', fmt: 'rp' },
    { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
  ],
};

// Alias duck variants to their poultry counterparts
MODE_SUMMARY_CONFIG.bebek_pedaging = MODE_SUMMARY_CONFIG.broiler;
MODE_SUMMARY_CONFIG.bebek_petelur = MODE_SUMMARY_CONFIG.petelur;
MODE_SUMMARY_CONFIG.kambing_pedaging = MODE_SUMMARY_CONFIG.penggemukan;
MODE_SUMMARY_CONFIG.kambing_perah = MODE_SUMMARY_CONFIG.susu;
MODE_SUMMARY_CONFIG.sapi_pedaging = MODE_SUMMARY_CONFIG.penggemukan;
MODE_SUMMARY_CONFIG.sapi_perah = MODE_SUMMARY_CONFIG.susu;
MODE_SUMMARY_CONFIG.pembibitan_sapi = MODE_SUMMARY_CONFIG.breeding_ruminansia;

// Fallback config for unmapped modes
const FALLBACK_CONFIG = [
  { key: 'laba', label: 'Laba Bersih', fmt: 'rp' },
  { key: 'margin', label: 'Margin', fmt: 'rp' },
];

function formatValue(value: any, fmt: 'rp' | 'pct' | 'num' | 'days'): string {
  if (value === undefined || value === null || isNaN(value)) return '—';
  switch (fmt) {
    case 'rp':
      return formatRp(value);
    case 'pct':
      return formatPct(value);
    case 'days':
      return `${Math.round(value)} hari`;
    case 'num':
    default:
      return formatNum(value);
  }
}

function buildSummaryRows(mode: string, stats: any): string[][] {
  const config = MODE_SUMMARY_CONFIG[mode] || FALLBACK_CONFIG;
  const rows: string[][] = [];
  config.forEach((item) => {
    const value = stats[item.key];
    if (value !== undefined && value !== null && !isNaN(value)) {
      rows.push([item.label, formatValue(value, item.fmt)]);
    }
  });
  return rows;
}

function buildLineItemTables(cycle: any): {
  modal: string[][];
  biaya: string[][];
  panen: string[][];
  sampling?: string[][];
  kualitasAir?: string[][];
} {
  const modal = Object.entries(cycle.data?.modal || {}).map(([k, v]) => [k, formatRp(Number(v) || 0)]);

  const biaya = (cycle.data?.biaya || []).map((b: any) => [
    b.tgl || '',
    b.type || b.jenis || '',
    b.nama || b.jenis || '',
    formatRp(b.total || 0),
  ]);

  const panen = [
    ...(cycle.data?.panen || []).map((p: any) => [
      p.tgl || '',
      p.kg || p.jml_jual || '',
      formatRp((parseFloat(p.kg || p.jml_jual || 0)) * (parseFloat(p.harga_kg || 0))),
    ]),
    ...(cycle.data?.penjualan || []).map((p: any) => [p.tgl || '', p.kg || p.jml || p.liter || '', formatRp(p.total || 0)]),
  ];

  const result: any = { modal, biaya, panen };

  if (cycle.mode === 'ikan_pembesaran' || cycle.mode === 'ikan_pembibitan') {
    result.sampling = (cycle.data?.sampling || []).map((s: any) => {
      const rata = parseFloat(s.bobot_total_g) / Math.max(1, parseFloat(s.jml_sampel) || 1);
      const cvVal = s.stdev_g && rata > 0 ? (parseFloat(s.stdev_g) / rata) * 100 : 0;
      return [
        s.tgl || '',
        String(s.jml_sampel || 0),
        String(s.bobot_total_g || 0),
        String(s.jml_estimasi || 0),
        String(s.jml_mati || 0),
        String(s.stdev_g || 0),
        `${cvVal.toFixed(1)}%`,
      ];
    });

    result.kualitasAir = (cycle.data?.kualitas_air || []).map((w: any) => [
      w.tgl || '',
      String(w.suhu || 0),
      String(w.ph || 0),
      String(w.do || 0),
      String(w.amonia || 0),
      String(w.nitrit || 0),
      String(w.kecerahan || 0),
      String(w.volume_flok || 0),
      String(w.cn_ratio || 0),
    ]);
  }

  return result;
}

function renderHeader(doc: jsPDF, cycle: any, orgName?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Brand banner
  doc.setFillColor(133, 150, 129); // #859681
  doc.rect(0, 0, pageWidth, 70, 'F');

  // RADEYA title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('RADEYA', 20, 30);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Siklus Produksi', 20, 46);

  // Date on right
  doc.setFontSize(9);
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(today, pageWidth - 20, 30, { align: 'right' });

  // Body text
  doc.setTextColor(60, 53, 48); // #3C3530
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(cycle.name || 'Siklus Produksi', 20, 95);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const subtitle = `${orgName || 'Peternakan'} • ${ANIMAL_LABELS[cycle.animal] || cycle.animal}`;
  doc.text(subtitle, 20, 112);

  return 135; // Return cursor Y position for next content
}

export function generateCycleReportPDF({
  cycle,
  stats,
  orgName,
}: {
  cycle: any;
  stats: any;
  orgName?: string;
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Render header
  let cursorY = renderHeader(doc, cycle, orgName);

  // Summary table
  const summaryRows = buildSummaryRows(cycle.mode, stats);
  if (summaryRows.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Ringkasan Kinerja', 'Nilai']],
      body: summaryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [133, 150, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      styles: { cellPadding: 5, font: 'helvetica' },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 20, right: 20 },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Line item tables
  const lineItems = buildLineItemTables(cycle);

  // Modal Awal
  if (lineItems.modal.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Modal Awal', 'Nilai']],
      body: lineItems.modal,
      theme: 'striped',
      headStyles: { fillColor: [234, 221, 201], textColor: [60, 53, 48], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 4, font: 'helvetica' },
      margin: { left: 20, right: 20 },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Biaya Operasional
  if (lineItems.biaya.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Tanggal', 'Jenis', 'Nama', 'Total']],
      body: lineItems.biaya,
      theme: 'striped',
      headStyles: { fillColor: [234, 221, 201], textColor: [60, 53, 48], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 4, font: 'helvetica' },
      margin: { left: 20, right: 20 },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Panen / Penjualan
  if (lineItems.panen.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Tanggal', 'Qty', 'Total']],
      body: lineItems.panen,
      theme: 'striped',
      headStyles: { fillColor: [234, 221, 201], textColor: [60, 53, 48], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 4, font: 'helvetica' },
      margin: { left: 20, right: 20 },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Sampling Pertumbuhan (fish only)
  if (lineItems.sampling && lineItems.sampling.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Tgl', 'Jml Sampel', 'Bobot (g)', 'Est Pop', 'Mati', 'Stdev (g)', 'CV %']],
      body: lineItems.sampling,
      theme: 'striped',
      headStyles: { fillColor: [234, 221, 201], textColor: [60, 53, 48], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 4, font: 'helvetica' },
      margin: { left: 20, right: 20 },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Kualitas Air (fish only)
  if (lineItems.kualitasAir && lineItems.kualitasAir.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [['Tgl', 'Suhu', 'pH', 'DO', 'Amonia', 'Nitrit', 'Kecerahan', 'Vol Flok', 'C/N']],
      body: lineItems.kualitasAir,
      theme: 'striped',
      headStyles: { fillColor: [234, 221, 201], textColor: [60, 53, 48], fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 4, font: 'helvetica' },
      margin: { left: 20, right: 20 },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Page numbers + footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const footerText = `Halaman ${i} dari ${pageCount} — Radeya.id`;
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
  }

  // Save
  const filename = `radeya_laporan_${cycle.animal}_${(cycle.name || 'siklus').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
