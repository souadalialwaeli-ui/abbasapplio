/**
 * Applio adapter — constants and helpers describing the REAL Applio
 * workflow. This module contains no network client: abbasapplio does not
 * call Applio's Gradio API directly (the Gradio session belongs to the
 * user's own Colab runtime and is used through its own browser UI).
 *
 * Its job is to keep Applio's parameter names, ranges and file formats in
 * one place so the Conversion / Training forms always match what Applio
 * actually accepts, and so a future, policy-supported API adapter has a
 * single seam to plug into.
 */

export const APPLIO_DEFAULT_PORT = 6969;

/** F0 extraction methods offered by Applio's inference tab. */
export const F0_METHODS = [
  { value: 'rmvpe', label: 'RMVPE', hint: 'recommended' },
  { value: 'pm', label: 'PM' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'crepe', label: 'Crepe' },
  { value: 'crepe-tiny', label: 'Crepe Tiny' },
] as const;

/** Resample rates offered by Applio (0 = keep original). */
export const RESAMPLE_RATES = [0, 16000, 22050, 32000, 40000, 44100, 48000] as const;

export const CONVERSION_RANGES = {
  pitch: { min: -12, max: 12, step: 1 },
  indexRate: { min: 0, max: 1, step: 0.01 },
  filterRadius: { min: 0, max: 7, step: 1 },
  rmsMixRate: { min: 0, max: 1, step: 0.01 },
  protect: { min: 0, max: 0.5, step: 0.01 },
} as const;

/** Training sample rates Applio supports for RVC models. */
export const TRAINING_SAMPLE_RATES = [32000, 40000, 48000] as const;

/** Applio model file formats. */
export const MODEL_EXTENSIONS = {
  weights: '.pth',
  index: '.index',
} as const;

/**
 * Human-readable summary of conversion settings, so the user can copy the
 * exact values into the Applio Gradio UI (Infer tab) when running a job.
 */
export function settingsSummary(settings: {
  pitch: number;
  indexRate: number;
  filterRadius: number;
  rmsMixRate: number;
  protect: number;
  f0Method: string;
  resampleRate: number;
}): string {
  return [
    `Pitch: ${settings.pitch}`,
    `Index rate: ${settings.indexRate}`,
    `Filter radius: ${settings.filterRadius}`,
    `RMS mix rate: ${settings.rmsMixRate}`,
    `Protect: ${settings.protect}`,
    `F0 method: ${settings.f0Method}`,
    `Resample: ${settings.resampleRate === 0 ? 'original' : settings.resampleRate + ' Hz'}`,
  ].join(' · ');
}
