import { FEED_INGREDIENTS, FeedIngredient } from '../constants/feedIngredients';
import { FeedTarget } from '../constants/feedTargets';

export interface RecipeRow {
  ingredient_id: string;
  persen: number;
  harga_per_kg: number;
}

export interface RecipeResult {
  pk: number;
  em: number;
  lk: number;
  sk: number;
  ca: number;
  p: number;
  biaya_per_kg: number;
  total_persen: number;
  pk_ok: boolean;
  em_ok: boolean;
  total_ok: boolean;
}

export const calcRecipe = (rows: RecipeRow[], target: FeedTarget): RecipeResult => {
  const ingredientsMap: Record<string, FeedIngredient> = FEED_INGREDIENTS.reduce((acc, ing) => {
    acc[ing.id] = ing;
    return acc;
  }, {} as Record<string, FeedIngredient>);

  const total = rows.reduce((s, r) => s + r.persen, 0);

  const result = {
    pk:  rows.reduce((s, r) => s + ((ingredientsMap[r.ingredient_id]?.pk || 0)  * r.persen / 100), 0),
    em:  rows.reduce((s, r) => s + ((ingredientsMap[r.ingredient_id]?.em || 0)  * r.persen / 100), 0),
    lk:  rows.reduce((s, r) => s + ((ingredientsMap[r.ingredient_id]?.lk || 0)  * r.persen / 100), 0),
    sk:  rows.reduce((s, r) => s + ((ingredientsMap[r.ingredient_id]?.sk || 0)  * r.persen / 100), 0),
    ca:  rows.reduce((s, r) => s + ((ingredientsMap[r.ingredient_id]?.ca || 0)  * r.persen / 100), 0),
    p:   rows.reduce((s, r) => s + ((ingredientsMap[r.ingredient_id]?.p || 0)   * r.persen / 100), 0),
    biaya_per_kg: rows.reduce((s, r) => s + (r.harga_per_kg * r.persen / 100), 0),
    total_persen: total,
  };

  return {
    ...result,
    pk_ok: result.pk >= target.pk * 0.95,   // tolerance ±5%
    em_ok: result.em >= target.em * 0.95,
    total_ok: Math.abs(total - 100) < 0.5,   // total must be ≈ 100%
  };
};

export interface PearsonResult {
  persen_bahan1: number;
  persen_bahan2: number;
  pk_hasil: number;
}

export const pearsonSquare = (
  pk_bahan1: number,
  pk_bahan2: number,
  pk_target: number
): PearsonResult => {
  const minPk = Math.min(pk_bahan1, pk_bahan2);
  const maxPk = Math.max(pk_bahan1, pk_bahan2);
  if (pk_target < minPk || pk_target > maxPk) {
    return {
      persen_bahan1: 0,
      persen_bahan2: 0,
      pk_hasil: 0,
    };
  }

  const bagian1 = Math.abs(pk_target - pk_bahan2);  // part of ingredient 1
  const bagian2 = Math.abs(pk_bahan1 - pk_target);  // part of ingredient 2
  const total = bagian1 + bagian2;

  if (total === 0) {
    return {
      persen_bahan1: 50,
      persen_bahan2: 50,
      pk_hasil: pk_target,
    };
  }

  return {
    persen_bahan1: (bagian1 / total) * 100,
    persen_bahan2: (bagian2 / total) * 100,
    pk_hasil: (pk_bahan1 * bagian1 + pk_bahan2 * bagian2) / total,
  };
};
