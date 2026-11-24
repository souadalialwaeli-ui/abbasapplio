/**
 * Shared domain types for abbasapplio.
 *
 * Everything here is local-first: models, projects and jobs live in
 * IndexedDB on the user's device. Nothing is synced to any server by
 * this app. Colab sessions are linked by the user pasting their own
 * Gradio share URL (see services/colab).
 */

export type Language = 'ar' | 'en';
export type Accent = 'violet' | 'indigo' | 'fuchsia';

export type ColabMethod = 'gradio' | 'localtunnel' | 'ngrok';
export type ColabStatus = 'disconnected' | 'linked' | 'unverified' | 'expired';

export interface ColabSession {
  /** The public URL the user copied from their own running notebook. */
  url: string;
  method: ColabMethod;
  /** ISO timestamp of when the user linked the URL in this app. */
  linkedAt: string;
  /** ISO timestamp of the last reachability probe (if any). */
  lastCheckedAt: string | null;
  /** Result of the last probe: 'reachable' | 'unreachable' | 'unknown' (CORS). */
  lastProbe: 'reachable' | 'unreachable' | 'unknown' | null;
  status: ColabStatus;
}

export interface VoiceModel {
  id: string;
  name: string;
  /** Applio / RVC model file (.pth). Stored as a Blob in IndexedDB. */
  pthFileName: string;
  pthSize: number;
  pthBlob?: Blob;
  /** Optional feature index file (.index). */
  indexFileName?: string;
  indexSize?: number;
  indexBlob?: Blob;
  /** Free-form notes, e.g. where the voice came from / consent note. */
  notes?: string;
  createdAt: string;
  /** Last time the model was used in a conversion job. */
  lastUsedAt: string | null;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  blob?: Blob;
  durationSec?: number;
  addedAt: string;
}

export interface AudioProject {
  id: string;
  name: string;
  notes: string;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Applio / RVC conversion parameters. These mirror the controls in the
 * official Applio Gradio UI ("Infer" tab). They are stored as form state
 * and shown to the user so they can reproduce them in the Applio UI —
 * this app does not run conversion itself.
 */
export interface ConversionSettings {
  /** Pitch shift in semitones, -12..12. */
  pitch: number;
  /** Index rate (retrieval influence), 0..1. */
  indexRate: number;
  /** Filter radius, 0..7. */
  filterRadius: number;
  /** RMS mix rate, 0..1. */
  rmsMixRate: number;
  /** Protect voiceless consonants, 0..0.5. */
  protect: number;
  /** Audio quality / resampling method. */
  resampleRate: number;
  /** F0 extraction method. */
  f0Method: 'rmvpe' | 'pm' | 'harvest' | 'crepe' | 'crepe-tiny';
}

export const DEFAULT_CONVERSION_SETTINGS: ConversionSettings = {
  pitch: 0,
  indexRate: 0.75,
  filterRadius: 3,
  rmsMixRate: 0.25,
  protect: 0.33,
  resampleRate: 0,
  f0Method: 'rmvpe',
};

export type JobStatus =
  | 'waiting-colab' // created locally, waiting for a linked Colab session
  | 'in-progress' // user confirmed processing started in Applio
  | 'completed' // user attached a real output file
  | 'failed'
  | 'interrupted';

export interface ConversionJob {
  id: string;
  name: string;
  /** Original input file (stored locally). */
  inputFileName: string;
  inputSize: number;
  inputBlob?: Blob;
  inputDurationSec?: number;
  modelId: string | null;
  modelName: string | null;
  settings: ConversionSettings;
  status: JobStatus;
  /** Real output file, attached by the user after Applio finishes. */
  outputFileName: string | null;
  outputSize: number | null;
  outputBlob?: Blob;
  /** Free-form note, e.g. error text copied from Applio. */
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type TrainingStatus = 'waiting-colab' | 'in-progress' | 'completed' | 'failed' | 'interrupted';

export interface TrainingSession {
  id: string;
  name: string;
  /** Voice dataset files (local, user-authorized recordings only). */
  datasetFiles: ProjectFile[];
  /** Applio / RVC training parameters (form state, reproduced in Applio). */
  epochs: number;
  batchSize: number;
  sampleRate: 32000 | 40000 | 48000;
  saveEveryEpochs: number;
  totalEpochs: number;
  status: TrainingStatus;
  /** Epochs the user has confirmed as completed (from Applio/TensorBoard). */
  confirmedEpochs: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  language: Language;
  accent: Accent;
  /** The user confirmed they will only use voices they own or are authorized to use. */
  consentConfirmed: boolean;
  consentConfirmedAt: string | null;
}
