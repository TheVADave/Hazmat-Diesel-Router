import type { LoadPreset } from '../types'

// --- Rig assumptions (from the plan + real diesel tanker figures) ---
//
// Diesel weighs ~7.1 lb/gal. The plan pins a fully loaded 6,500 gal run at
// ~80,000 lb gross, so we back out a tare (empty rig) weight that lands there
// and add the diesel weight for every other preset.
//
//   tare = 80,000 - (6,500 * 7.1) = 33,850 lb
//
// Note: the 8,000 gal preset comes out over 80,000 lb on paper. That's real —
// it's the kind of load that needs a permit. The bridge/weight check is meant
// to flag exactly that, so we keep the honest number.

export const DIESEL_LB_PER_GAL = 7.1
export const TARE_WEIGHT_LB = 33_850

function grossWeightForGallons(gallons: number): number {
  return Math.round(TARE_WEIGHT_LB + gallons * DIESEL_LB_PER_GAL)
}

export const LOAD_PRESETS: LoadPreset[] = [
  { gallons: 500, label: '500 gal', grossWeightLb: grossWeightForGallons(500) },
  { gallons: 2_000, label: '2,000 gal', grossWeightLb: grossWeightForGallons(2_000) },
  { gallons: 5_000, label: '5,000 gal', grossWeightLb: grossWeightForGallons(5_000) },
  { gallons: 6_500, label: '6,500 gal', grossWeightLb: grossWeightForGallons(6_500) },
  { gallons: 8_000, label: '8,000 gal', grossWeightLb: grossWeightForGallons(8_000) },
]

/** Default preset shown on load: the standard 6,500 gal run. */
export const DEFAULT_LOAD = LOAD_PRESETS[3]

// --- Standard tanker dimensions (HERE wants centimetres) ---
// 13'6" tall, 102" wide, ~62 ft combo length, 5 axles, 1 trailer.
export const TRUCK_DIMENSIONS = {
  heightCm: 410,
  widthCm: 260,
  lengthCm: 1_900,
  axleCount: 5,
  trailerCount: 1,
}

export const LB_TO_KG = 0.453_592

export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG)
}
