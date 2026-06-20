import React, { useState, useEffect, useMemo } from 'react';
import { FEED_INGREDIENTS, FeedIngredient } from '../constants/feedIngredients';
import { FEED_TARGETS, FeedTarget } from '../constants/feedTargets';
import { calcRecipe, pearsonSquare, RecipeRow } from '../lib/feedCalc';

interface FeedFormulatorProps {
  activeCycle: any;
  onSaveRecipe: (recipe: any) => Promise<void>;
  savedRecipes?: any[];
}

export default function FeedFormulator({ activeCycle, onSaveRecipe, savedRecipes = [] }: FeedFormulatorProps) {
  const [activeTab, setActiveTab] = useState<'weighted' | 'pearson'>('weighted');
  
  // Weighted Average state
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('broiler_finisher');
  const [recipeName, setRecipeName] = useState<string>('Resep Pakan Mandiri');
  const [factoryPrice, setFactoryPrice] = useState<number>(7500);
  const [feedForm, setFeedForm] = useState<'mash' | 'crumble' | 'pellet_tenggelam' | 'pellet_apung'>('mash');

  // Load target matching the active cycle commodity
  useEffect(() => {
    if (activeCycle) {
      const mode = activeCycle.mode;
      const animal = activeCycle.animal;
      const jenisIkan = activeCycle.data?.modal?.jenis_ikan || '';

      if (mode === 'broiler') {
        setSelectedTargetKey('broiler_finisher');
      } else if (mode === 'petelur') {
        setSelectedTargetKey('layer_produksi');
      } else if (mode === 'bebek_pedaging') {
        setSelectedTargetKey('bebek_pedaging');
      } else if (mode === 'bebek_petelur') {
        setSelectedTargetKey('bebek_petelur');
      } else if (mode === 'ikan_pembesaran' || mode === 'ikan_pembibitan') {
        if (jenisIkan === 'nila') {
          setSelectedTargetKey('nila_pembesaran');
        } else {
          setSelectedTargetKey('lele_pembesaran');
        }
      } else if (mode === 'penggemukan') {
        if (animal?.startsWith('kambing')) {
          setSelectedTargetKey('kambing_penggemukan');
        } else {
          setSelectedTargetKey('sapi_penggemukan');
        }
      }
    }
  }, [activeCycle]);

  // Ingredients rows state
  // Pre-populate with default local prices
  const [ingredientRows, setIngredientRows] = useState<Record<string, { active: boolean; persen: number; harga: number }>>(() => {
    const initial: Record<string, { active: boolean; persen: number; harga: number }> = {};
    const defaultPrices: Record<string, number> = {
      jagung: 5000,
      dedak: 3500,
      pollard: 4800,
      onggok: 2500,
      singkong: 3000,
      tpung_ikan: 15000,
      bk_kedelai: 10500,
      bk_kelapa: 5500,
      ampas_tahu: 2000,
      tpung_keong: 8000,
      tpung_tulang: 6000,
      kapur: 1500,
      premix: 45000,
      minyak_nab: 16000,
      garam: 3000
    };

    FEED_INGREDIENTS.forEach(ing => {
      // Default set corn, soybean meal, bran giling, and premix active
      const isDefaultActive = ['jagung', 'bk_kedelai', 'dedak', 'premix'].includes(ing.id);
      initial[ing.id] = {
        active: isDefaultActive,
        persen: isDefaultActive ? (ing.id === 'jagung' ? 50 : ing.id === 'bk_kedelai' ? 25 : ing.id === 'dedak' ? 24.5 : 0.5) : 0,
        harga: defaultPrices[ing.id] || 5000
      };
    });
    return initial;
  });

  // Category filter for ingredients list
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('semua');

  // Pearson Square state
  const [pearsonBahan1, setPearsonBahan1] = useState<string>('tpung_ikan');
  const [pearsonBahan2, setPearsonBahan2] = useState<string>('dedak');
  const [pearsonTargetPk, setPearsonTargetPk] = useState<number>(30);
  const [pearsonResult, setPearsonResult] = useState<{ persen1: number; persen2: number; pkHasil: number } | null>(null);

  // Auto calculate Pearson
  useEffect(() => {
    const ing1 = FEED_INGREDIENTS.find(i => i.id === pearsonBahan1);
    const ing2 = FEED_INGREDIENTS.find(i => i.id === pearsonBahan2);
    if (ing1 && ing2) {
      const res = pearsonSquare(ing1.pk, ing2.pk, pearsonTargetPk);
      setPearsonResult({
        persen1: res.persen_bahan1,
        persen2: res.persen_bahan2,
        pkHasil: res.pk_hasil
      });
    }
  }, [pearsonBahan1, pearsonBahan2, pearsonTargetPk]);

  // Handle Pearson Apply
  const applyPearsonToRecipe = () => {
    if (pearsonResult && pearsonResult.persen1 > 0) {
      setIngredientRows(prev => {
        const next = { ...prev };
        // Reset all ingredients to active: false, persen: 0
        Object.keys(next).forEach(key => {
          next[key] = { ...next[key], active: false, persen: 0 };
        });
        // Set the two Pearson ingredients active and with calculated percentages
        next[pearsonBahan1] = { ...next[pearsonBahan1], active: true, persen: parseFloat(pearsonResult.persen1.toFixed(2)) };
        next[pearsonBahan2] = { ...next[pearsonBahan2], active: true, persen: parseFloat(pearsonResult.persen2.toFixed(2)) };
        return next;
      });
      setActiveTab('weighted');
    }
  };

  // Prepare active rows for recipe calculation
  const activeRows = useMemo(() => {
    const rows: RecipeRow[] = [];
    Object.entries(ingredientRows).forEach(([id, val]) => {
      if (val.active) {
        rows.push({
          ingredient_id: id,
          persen: val.persen,
          harga_per_kg: val.harga
        });
      }
    });
    return rows;
  }, [ingredientRows]);

  const target = FEED_TARGETS[selectedTargetKey] || { pk: 19, em: 3100, label: 'Broiler Finisher' };

  // Calculate results
  const calcResults = useMemo(() => {
    return calcRecipe(activeRows, target);
  }, [activeRows, target]);

  // Estimate mixing order (from smallest percentage to largest percentage)
  const mixingOrder = useMemo(() => {
    return [...activeRows]
      .sort((a, b) => a.persen - b.persen)
      .map(r => {
        const ing = FEED_INGREDIENTS.find(i => i.id === r.ingredient_id);
        return {
          nama: ing?.nama || r.ingredient_id,
          persen: r.persen
        };
      });
  }, [activeRows]);

  // Safety limits warnings
  const safetyWarnings = useMemo(() => {
    const warnings: string[] = [];
    activeRows.forEach(r => {
      const ing = FEED_INGREDIENTS.find(i => i.id === r.ingredient_id);
      if (ing && ing.maks !== null && r.persen > ing.maks) {
        warnings.push(`⚠️ Penggunaan ${ing.nama} (${r.persen.toFixed(1)}%) melebihi batas aman maksimal ${ing.maks}%. (${ing.catatan})`);
      }
    });
    return warnings;
  }, [activeRows]);

  // Handle Save Recipe to Cycle
  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (Math.abs(calcResults.total_persen - 100) > 0.5) {
      alert('Total persentase pakan harus 100% untuk dapat menyimpan resep.');
      return;
    }
    setIsSaving(true);
    try {
      const recipeData = {
        id: 'resep_' + Date.now(),
        nama: recipeName,
        target: selectedTargetKey,
        bahan: activeRows.map(r => ({
          id: r.ingredient_id,
          persen: r.persen,
          harga_kg: r.harga_per_kg
        })),
        result: {
          pk: parseFloat(calcResults.pk.toFixed(2)),
          em: Math.round(calcResults.em),
          biaya_kg: Math.round(calcResults.biaya_per_kg)
        },
        created_at: new Date().toISOString()
      };
      await onSaveRecipe(recipeData);
      alert('✅ Resep pakan berhasil disimpan!');
    } catch (err: any) {
      alert('❌ Gagal menyimpan resep: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved recipe
  const loadRecipe = (recipe: any) => {
    if (recipe && recipe.bahan) {
      setRecipeName(recipe.nama);
      setSelectedTargetKey(recipe.target);
      setIngredientRows(prev => {
        const next = { ...prev };
        // Deactivate all first
        Object.keys(next).forEach(key => {
          next[key] = { ...next[key], active: false, persen: 0 };
        });
        // Activate saved ones
        recipe.bahan.forEach((b: any) => {
          if (next[b.id]) {
            next[b.id] = {
              active: true,
              persen: b.persen,
              harga: b.harga_kg
            };
          }
        });
        return next;
      });
    }
  };

  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredIngredients = FEED_INGREDIENTS.filter(ing => {
    if (selectedCategoryFilter === 'semua') return true;
    return ing.kat === selectedCategoryFilter;
  });

  const getFormDesc = (form: string) => {
    switch (form) {
      case 'mash':
        return {
          proses: 'Giling seluruh bahan padat hingga halus, campur merata menggunakan mixer horizontal.',
          alat: 'Hammer mill & Mixer',
          cocok: 'Unggas petelur, anak ayam (DOC), pakan awal bebek.'
        };
      case 'crumble':
        return {
          proses: 'Giling bahan → Campur → Kukus (Steam) → Cetak Pellet → Hancurkan kasar (Crumble) → Keringkan.',
          alat: 'Hammer mill, Mixer, Pellet Mill, Crumbler',
          cocok: 'Starter broiler, anak bebek, benih ikan.'
        };
      case 'pellet_tenggelam':
        return {
          proses: 'Campur bahan → Tambah air/perekat → Cetak dengan mesin press pellet → Keringkan di oven/sinar matahari.',
          alat: 'Mixer, Pelletizer, Dryer/Oven',
          cocok: 'Ikan mas, patin, ruminansia penggemukan.'
        };
      case 'pellet_apung':
        return {
          proses: 'Campur bahan → Ekstrusi suhu & tekanan tinggi dengan uap → Potong pakan keluar extruder → Keringkan.',
          alat: 'Twin screw Extruder (Investasi tinggi)',
          cocok: 'Lele dan Nila budidaya intensif.'
        };
      default:
        return { proses: '', alat: '', cocok: '' };
    }
  };

  return (
    <div className="space-y-6 text-[#3C3530]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#859681]/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-1">
          <h2 className="text-2xl font-black text-[#3C3530] flex items-center gap-2">🌾 Formulator Pakan Mandiri</h2>
          <p className="text-xs text-[#3C3530]/75 font-semibold">Racik pakan berkualitas dengan memanfaatkan bahan baku lokal untuk memotong biaya produksi pakan.</p>
        </div>
        
        {/* Toggle Mode Tab */}
        <div className="flex bg-[#FAF7F0] p-1.5 rounded-2xl border border-[#EADDC9] relative z-10 w-fit shrink-0">
          <button
            onClick={() => setActiveTab('weighted')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'weighted' ? 'bg-[#859681] text-[#FCFAF6] shadow-sm' : 'text-[#3C3530]/60 hover:text-[#3C3530]'}`}
          >
            🌾 Ransum Komplet
          </button>
          <button
            onClick={() => setActiveTab('pearson')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'pearson' ? 'bg-[#859681] text-[#FCFAF6] shadow-sm' : 'text-[#3C3530]/60 hover:text-[#3C3530]'}`}
          >
            🧮 Pearson Square
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Setup & Input Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'weighted' ? (
            <>
              {/* Form Config */}
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-4">
                <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block">⚙️ Pengaturan Formulasi</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/70 block uppercase tracking-wider">Target Nutrisi Fase</label>
                    <select
                      value={selectedTargetKey}
                      onChange={(e) => setSelectedTargetKey(e.target.value)}
                      className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#3C3530] cursor-pointer font-sans"
                    >
                      {Object.entries(FEED_TARGETS).map(([key, val]) => (
                        <option key={key} value={key} className="bg-[#FCFAF6] text-[#3C3530]">{val.label} (PK: {val.pk}%, EM: {val.em})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/70 block uppercase tracking-wider">Harga Pakan Pabrik (Rp/kg)</label>
                    <input
                      type="number"
                      value={factoryPrice || ''}
                      onChange={(e) => setFactoryPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#3C3530] font-mono"
                    />
                  </div>

                  {savedRecipes.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#3C3530]/70 block uppercase tracking-wider">Muat Resep Tersimpan</label>
                      <select
                        onChange={(e) => {
                          const r = savedRecipes.find(item => item.id === e.target.value);
                          if (r) loadRecipe(r);
                        }}
                        defaultValue=""
                        className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#3C3530] cursor-pointer font-sans"
                      >
                        <option value="" disabled className="bg-[#FCFAF6] text-[#3C3530]/50">Pilih resep...</option>
                        {savedRecipes.map((r) => (
                          <option key={r.id} value={r.id} className="bg-[#FCFAF6] text-[#3C3530]">{r.nama} ({r.result.pk}% PK)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Table of Ingredients */}
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block">🌱 Pilih Bahan Baku Lokal</span>
                  
                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap bg-[#FAF7F0] p-1 rounded-xl border border-[#EADDC9] w-fit shrink-0">
                    {[
                      { id: 'semua', label: 'Semua' },
                      { id: 'energi', label: 'Energi' },
                      { id: 'protein', label: 'Protein' },
                      { id: 'mineral', label: 'Mineral' },
                      { id: 'aditif', label: 'Aditif' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase ${selectedCategoryFilter === cat.id ? 'bg-[#859681] text-[#FCFAF6] shadow-sm' : 'text-[#3C3530]/60 hover:text-[#3C3530]'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto rounded-2xl border border-[#EADDC9] bg-[#FCFAF6]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F3EFE3] text-[#3C3530]/75 text-[10px] font-black uppercase tracking-wider border-b border-[#EADDC9]">
                        <th className="py-3 px-4 w-12 text-center">Aktif</th>
                        <th className="py-3 px-4">Bahan Pakan</th>
                        <th className="py-3 px-4 text-center">PK (%)</th>
                        <th className="py-3 px-4 text-center">EM (kcal)</th>
                        <th className="py-3 px-4 text-center w-24">Porsi (%)</th>
                        <th className="py-3 px-4 text-right w-28">Harga (Rp/kg)</th>
                        <th className="py-3 px-4 text-right w-24">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADDC9] text-xs font-semibold">
                      {filteredIngredients.map(ing => {
                        const row = ingredientRows[ing.id] || { active: false, persen: 0, harga: 0 };
                        return (
                          <tr key={ing.id} className={`hover:bg-[#FAF7F0]/80 transition-colors ${row.active ? 'bg-[#859681]/5 text-[#3C3530]' : 'opacity-60 text-[#3C3530]/75'}`}>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={row.active}
                                onChange={(e) => {
                                    setIngredientRows(prev => ({
                                      ...prev,
                                      [ing.id]: { ...prev[ing.id], active: e.target.checked }
                                    }));
                                }}
                                className="w-4 h-4 rounded text-[#859681] focus:ring-[#859681] bg-[#FCFAF6] border-[#EADDC9] cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 space-y-1">
                              <span className="text-[#3C3530] block font-bold">{ing.nama}</span>
                              <span className="text-[10px] text-[#3C3530]/65 block font-normal leading-relaxed">{ing.catatan}</span>
                              {ing.maks !== null && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-[#FAF7F0] text-[#3C3530]/60 text-[9px] font-black font-mono border border-[#EADDC9]">
                                  LIMIT: {ing.maks}%
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-[#3C3530]/85">{ing.pk.toFixed(1)}%</td>
                            <td className="py-3 px-4 text-center font-mono text-[#3C3530]/85">{ing.em}</td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                step="0.1"
                                disabled={!row.active}
                                value={row.active ? (row.persen || '') : ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setIngredientRows(prev => ({
                                    ...prev,
                                    [ing.id]: { ...prev[ing.id], persen: val }
                                  }));
                                }}
                                className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-2.5 py-1.5 text-center font-mono text-xs text-[#3C3530] disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                disabled={!row.active}
                                value={row.harga || ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setIngredientRows(prev => ({
                                    ...prev,
                                    [ing.id]: { ...prev[ing.id], harga: val }
                                  }));
                                }}
                                className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-2.5 py-1.5 text-right font-mono text-xs text-[#3C3530] disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#3C3530]/85">
                              {row.active ? formatRp(row.persen * row.harga / 100) : 'Rp0'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* PEARSON SQUARE UI */
            <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
              <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block">🧮 Pearson Square Solver (2 Bahan)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/70 block uppercase tracking-wider">Bahan Pakan 1 (Protein Tinggi)</label>
                    <select
                      value={pearsonBahan1}
                      onChange={(e) => setPearsonBahan1(e.target.value)}
                      className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-3 py-2.5 text-xs text-[#3C3530] font-semibold cursor-pointer"
                    >
                      {FEED_INGREDIENTS.map(i => (
                        <option key={i.id} value={i.id} className="bg-[#FCFAF6] text-[#3C3530]">{i.nama} (PK: {i.pk}%)</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/70 block uppercase tracking-wider">Bahan Pakan 2 (Protein Rendah)</label>
                    <select
                      value={pearsonBahan2}
                      onChange={(e) => setPearsonBahan2(e.target.value)}
                      className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-3 py-2.5 text-xs text-[#3C3530] font-semibold cursor-pointer"
                    >
                      {FEED_INGREDIENTS.map(i => (
                        <option key={i.id} value={i.id} className="bg-[#FCFAF6] text-[#3C3530]">{i.nama} (PK: {i.pk}%)</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/70 block uppercase tracking-wider">Target PK Campuran (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={pearsonTargetPk || ''}
                      onChange={(e) => setPearsonTargetPk(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                </div>

                {/* Diagram visual */}
                <div className="md:col-span-2 flex flex-col justify-center items-center bg-[#FAF7F0] p-6 rounded-2xl border border-[#EADDC9] font-semibold">
                  {pearsonResult && pearsonResult.persen1 > 0 ? (
                    <div className="space-y-4 w-full">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <div className="p-3 bg-[#EADDC9] border border-[#859681] rounded-xl text-center w-28 text-[#3C3530]">
                          <span className="text-[9px] text-[#3C3530]/60 block uppercase font-black">Bahan 1</span>
                          <span className="text-[#3C3530] font-extrabold block truncate">{FEED_INGREDIENTS.find(i => i.id === pearsonBahan1)?.nama}</span>
                          <span className="text-[#859681] block font-bold text-xs">{FEED_INGREDIENTS.find(i => i.id === pearsonBahan1)?.pk}% PK</span>
                        </div>
                        <div className="text-[#3C3530]/40 flex flex-col items-center">
                          <span>\</span>
                          <span>/</span>
                        </div>
                        <div className="p-4 bg-[#859681]/15 border border-[#859681]/35 rounded-full w-14 h-14 flex items-center justify-center font-bold text-[#4D5D4A] text-sm">
                          {pearsonTargetPk}%
                        </div>
                        <div className="text-[#3C3530]/40 flex flex-col items-center">
                          <span>/</span>
                          <span>\</span>
                        </div>
                        <div className="p-3 bg-[#EADDC9] border border-[#859681] rounded-xl text-center w-28 text-[#3C3530]">
                          <span className="text-[9px] text-[#3C3530]/60 block uppercase font-black">Bahan 2</span>
                          <span className="text-[#3C3530] font-extrabold block truncate">{FEED_INGREDIENTS.find(i => i.id === pearsonBahan2)?.nama}</span>
                          <span className="text-[#859681] block font-bold text-xs">{FEED_INGREDIENTS.find(i => i.id === pearsonBahan2)?.pk}% PK</span>
                        </div>
                      </div>

                      <div className="bg-[#859681]/5 border border-[#859681]/20 p-5 rounded-2xl text-xs space-y-3 font-semibold">
                        <span className="text-[10px] font-black uppercase text-[#859681] tracking-wider block">📌 Hasil Formulasi Pearson</span>
                        <div className="flex justify-between items-center py-1 text-[#3C3530]">
                          <span>{FEED_INGREDIENTS.find(i => i.id === pearsonBahan1)?.nama}:</span>
                          <span className="font-mono text-[#4D5D4A] text-sm font-black">{pearsonResult.persen1.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-[#EADDC9] text-[#3C3530]">
                          <span>{FEED_INGREDIENTS.find(i => i.id === pearsonBahan2)?.nama}:</span>
                          <span className="font-mono text-[#4D5D4A] text-sm font-black">{pearsonResult.persen2.toFixed(1)}%</span>
                        </div>
                        <div className="pt-2 border-t border-[#EADDC9] flex justify-between items-center font-bold text-[#3C3530]">
                          <span>PK Terhitung Akhir:</span>
                          <span className="font-mono text-[#3C3530]">{pearsonResult.pkHasil.toFixed(2)}%</span>
                        </div>
                      </div>

                      <button
                        onClick={applyPearsonToRecipe}
                        className="w-full bg-[#859681] hover:bg-[#72836E] text-[#FCFAF6] text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
                      >
                        ⚡ Terapkan Hasil Ke Racikan Utama
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8 space-y-2">
                      <span className="text-3xl">🧩</span>
                      <p className="text-[#3C3530]/75 text-xs">Formulasi tidak mungkin. Target PK harus berada di antara persentase PK Bahan 1 dan Bahan 2.</p>
                      <p className="text-[#3C3530]/50 text-[10px]">Contoh: Tepung Ikan (50%) dan Dedak (10%) untuk target 30%.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Dashboard Results (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metrics Preview */}
          <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#859681]/5 rounded-full blur-2xl" />
            
            <div className="space-y-1.5 relative z-10">
              <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block">📊 Ringkasan Nutrisi Racikan</span>
              <h3 className="text-[#3C3530]/70 text-xs font-bold">Hasil Live Kalkulasi</h3>
            </div>

            {/* Live PK Gauge */}
            <div className="space-y-4 relative z-10">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EADDC9] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#3C3530]/70 font-bold uppercase tracking-wider text-[10px]">Protein Kasar (PK)</span>
                  <span className="text-[#3C3530]/50 font-bold font-mono">Target: {target.pk}%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black font-mono ${calcResults.pk_ok ? 'text-[#859681]' : 'text-[#A76A57]'}`}>
                    {calcResults.pk.toFixed(2)}%
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-sans ${calcResults.pk_ok ? 'bg-[#859681]/10 text-[#859681]' : 'bg-[#A76A57]/10 text-[#A76A57]'}`}>
                    {calcResults.pk_ok ? 'MEMENUHI' : 'KURANG'}
                  </span>
                </div>
              </div>

              {/* Live EM Gauge */}
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EADDC9] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#3C3530]/70 font-bold uppercase tracking-wider text-[10px]">Energi Metabolis (EM)</span>
                  <span className="text-[#3C3530]/50 font-bold font-mono">Target: {target.em}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black font-mono ${calcResults.em_ok ? 'text-[#859681]' : 'text-[#A76A57]'}`}>
                    {Math.round(calcResults.em)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-sans ${calcResults.em_ok ? 'bg-[#859681]/10 text-[#859681]' : 'bg-[#A76A57]/10 text-[#A76A57]'}`}>
                    {calcResults.em_ok ? 'MEMENUHI' : 'KURANG'}
                  </span>
                </div>
              </div>

              {/* Other Nutrients */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF7F0] p-4.5 rounded-2xl border border-[#EADDC9] font-mono text-[#3C3530]">
                <div className="space-y-0.5">
                  <span className="text-[#3C3530]/60 text-[9px] uppercase font-bold block font-sans">Lemak Kasar (LK)</span>
                  <span className="text-[#3C3530] font-bold">{calcResults.lk.toFixed(2)}%</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#3C3530]/60 text-[9px] uppercase font-bold block font-sans">Serat Kasar (SK)</span>
                  <span className="text-[#3C3530] font-bold">{calcResults.sk.toFixed(2)}%</span>
                </div>
                <div className="space-y-0.5 pt-2 border-t border-[#EADDC9]">
                  <span className="text-[#3C3530]/60 text-[9px] uppercase font-bold block font-sans">Kalsium (Ca)</span>
                  <span className="text-[#3C3530] font-bold">{calcResults.ca.toFixed(2)}%</span>
                </div>
                <div className="space-y-0.5 pt-2 border-t border-[#EADDC9]">
                  <span className="text-[#3C3530]/60 text-[9px] uppercase font-bold block font-sans">Fosfor (P)</span>
                  <span className="text-[#3C3530] font-bold">{calcResults.p.toFixed(2)}%</span>
                </div>
              </div>

              {/* Total Porsi & Price Compare */}
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EADDC9] space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#3C3530]/75 font-bold text-[10px] uppercase">Total Porsi Racikan</span>
                  <span className={`font-mono font-black ${calcResults.total_ok ? 'text-[#859681]' : 'text-[#A76A57]'}`}>
                    {calcResults.total_persen.toFixed(1)}% / 100%
                  </span>
                </div>
                {!calcResults.total_ok && (
                  <div className="text-[10px] text-[#A76A57] bg-[#A76A57]/5 p-2.5 rounded-xl border border-[#A76A57]/15 leading-normal font-sans">
                    {calcResults.total_persen < 100 ? (
                      <span>⚠️ Kurang <strong>{(100 - calcResults.total_persen).toFixed(1)}%</strong> bahan lagi. Silakan tambah porsi bahan pakan.</span>
                    ) : (
                      <span>⚠️ Kelebihan <strong>{(calcResults.total_persen - 100).toFixed(1)}%</strong> bahan. Kurangi porsi bahan pakan.</span>
                    )}
                  </div>
                )}

                {/* Price comparison */}
                <div className="pt-3 border-t border-[#EADDC9] space-y-2">
                  <div className="flex justify-between text-xs py-0.5">
                    <span className="text-[#3C3530]/60">Biaya Racikan/kg:</span>
                    <span className="font-mono text-[#3C3530] font-bold">{formatRp(calcResults.biaya_per_kg)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-0.5">
                    <span className="text-[#3C3530]/60">Harga Pakan Pabrik:</span>
                    <span className="font-mono text-[#3C3530]/70">{formatRp(factoryPrice)}</span>
                  </div>
                  {factoryPrice > calcResults.biaya_per_kg && (
                    <div className="p-3 bg-[#859681]/5 rounded-xl border border-[#859681]/20 text-xs text-[#4D5D4A] font-bold flex flex-col items-center text-center font-sans mt-2">
                      <span className="text-[9px] uppercase tracking-wider opacity-80">Estimasi Penghematan</span>
                      <span className="text-lg font-black font-mono text-[#4D5D4A]">
                        {((factoryPrice - calcResults.biaya_per_kg) / factoryPrice * 100).toFixed(0)}% lebih hemat
                      </span>
                      <span className="text-[9px] opacity-75 font-normal text-[#3C3530]/80">Menghemat {formatRp(factoryPrice - calcResults.biaya_per_kg)} / kg pakan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Safety warning triggers */}
              {safetyWarnings.length > 0 && (
                <div className="space-y-2 bg-[#A76A57]/5 border border-[#A76A57]/15 p-4 rounded-2xl text-[10px] text-[#A76A57] leading-relaxed">
                  {safetyWarnings.map((w, index) => (
                    <div key={index}>{w}</div>
                  ))}
                </div>
              )}

              {/* Save section */}
              {calcResults.total_ok && (
                <div className="pt-3 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/70 block uppercase tracking-wider">Nama Resep Pakan</label>
                    <input
                      type="text"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      placeholder="Masukkan nama resep..."
                      className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#859681] hover:bg-[#72836E] text-[#FCFAF6] text-xs font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Menyimpan...' : '💾 Simpan Resep Pakan'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mixing instructions card */}
          {activeRows.length > 0 && (
            <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-4">
              <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block">⚙️ Petunjuk Pengolahan</span>
              
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#3C3530]/75 block uppercase tracking-wider">Pilih Bentuk Akhir Pakan</label>
                  <select
                    value={feedForm}
                    onChange={(e) => setFeedForm(e.target.value as any)}
                    className="w-full bg-[#FCFAF6] border border-[#EADDC9] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-3 py-2 text-xs text-[#3C3530] font-semibold cursor-pointer"
                  >
                    <option value="mash" className="bg-[#FCFAF6] text-[#3C3530]">Mash (Tepung / Ransum Giling)</option>
                    <option value="crumble" className="bg-[#FCFAF6] text-[#3C3530]">Crumble (Remahan / Pecahan Pellet)</option>
                    <option value="pellet_tenggelam" className="bg-[#FCFAF6] text-[#3C3530]">Pellet Tenggelam</option>
                    <option value="pellet_apung" className="bg-[#FCFAF6] text-[#3C3530]">Pellet Apung</option>
                  </select>
                </div>

                {/* Mixing steps */}
                <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-3 leading-relaxed text-[#3C3530]">
                  <div>
                    <span className="text-[9px] text-[#3C3530]/60 block uppercase font-black">Urutan Pencampuran (Kecil ke Besar)</span>
                    <ol className="list-decimal pl-4 mt-1.5 space-y-1 text-[#3C3530]/85 text-[11px] font-mono">
                      {mixingOrder.map((ing, idx) => (
                        <li key={idx} className="truncate">
                          {ing.nama} <span className="text-[#859681]">({ing.persen.toFixed(1)}%)</span>
                        </li>
                      ))}
                    </ol>
                    <span className="text-[9px] text-[#3C3530]/50 mt-2 block italic font-sans leading-normal">*Campurkan bahan bervolume mikro (premix/aditif) dengan sedikit dedak dahulu baru satukan dengan bahan makro.</span>
                  </div>

                  <div className="border-t border-[#EADDC9] pt-3">
                    <span className="text-[9px] text-[#3C3530]/60 block uppercase font-black">Proses Pembuatan ({feedForm.toUpperCase()})</span>
                    <p className="text-[11px] text-[#3C3530]/85 mt-1 font-sans leading-normal">{getFormDesc(feedForm).proses}</p>
                  </div>

                  <div className="border-t border-[#EADDC9] pt-3 grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                      <span className="text-[#3C3530]/60 block uppercase font-black text-[9px]">Mesin / Alat</span>
                      <span className="text-[#3C3530]/85 mt-0.5 block font-bold leading-normal">{getFormDesc(feedForm).alat}</span>
                    </div>
                    <div>
                      <span className="text-[#3C3530]/60 block uppercase font-black text-[9px]">Cocok Untuk</span>
                      <span className="text-[#3C3530]/85 mt-0.5 block font-bold leading-normal">{getFormDesc(feedForm).cocok}</span>
                    </div>
                  </div>
                </div>

                {/* Storage advice */}
                <div className="p-3 bg-[#A76A57]/5 rounded-xl border border-[#A76A57]/15 text-[10px] text-[#A76A57] leading-relaxed font-sans font-semibold">
                  <div>💡 <strong>Catatan Penyimpanan:</strong> Pastikan kadar air bahan pakan &lt; 12% dan disimpan di tempat beralas palet (kering & sirkulasi baik) maksimal 1 bulan. Dedak padi rawan tengik jika disimpan &gt; 3-4 minggu.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
