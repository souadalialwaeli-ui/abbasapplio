/**
 * Audio analysis helpers — all processing happens locally in the browser
 * via the Web Audio API. No audio is uploaded anywhere by this app.
 */

export interface AudioAnalysis {
  durationSec: number;
  sampleRate: number;
  channels: number;
  /** Peak amplitude 0..1 across all channels. */
  peak: number;
  /** RMS loudness 0..1. */
  rms: number;
  /** Fraction of samples at/near full scale (clipping estimate). */
  clippingRatio: number;
  /** Normalized waveform peaks for drawing (0..1). */
  peaks: number[];
}

const PEAK_BUCKETS = 120;

/** Decode an audio File/Blob and compute quality metrics + waveform peaks. */
export async function analyzeAudioFile(file: Blob): Promise<AudioAnalysis> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = buffer.getChannelData(0);
    const peaks = computePeaks(channelData, PEAK_BUCKETS);
    let peak = 0;
    let sumSquares = 0;
    let clipped = 0;
    // Sample every 4th frame for speed on long files.
    const step = 4;
    let count = 0;
    for (let i = 0; i < channelData.length; i += step) {
      const v = Math.abs(channelData[i]);
      if (v > peak) peak = v;
      sumSquares += v * v;
      if (v >= 0.999) clipped += 1;
      count += 1;
    }
    return {
      durationSec: buffer.duration,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      peak,
      rms: count ? Math.sqrt(sumSquares / count) : 0,
      clippingRatio: count ? clipped / count : 0,
      peaks,
    };
  } finally {
    await ctx.close();
  }
}

export function computePeaks(samples: Float32Array, buckets: number): number[] {
  const peaks: number[] = new Array(buckets).fill(0);
  const block = Math.floor(samples.length / buckets) || 1;
  for (let b = 0; b < buckets; b++) {
    let max = 0;
    const start = b * block;
    const end = Math.min(start + block, samples.length);
    for (let i = start; i < end; i += 2) {
      const v = Math.abs(samples[i]);
      if (v > max) max = v;
    }
    peaks[b] = max;
  }
  // Normalize so the loudest bucket is 1.
  const maxPeak = Math.max(...peaks, 0.0001);
  return peaks.map((p) => p / maxPeak);
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

export const ACCEPTED_AUDIO = '.wav,.mp3,.flac,.ogg,.m4a,.aac,.webm,audio/*';
export const ACCEPTED_MODEL = '.pth';
export const ACCEPTED_INDEX = '.index';
