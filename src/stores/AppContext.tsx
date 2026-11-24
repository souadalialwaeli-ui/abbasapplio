import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppSettings,
  AudioProject,
  ColabSession,
  ConversionJob,
  Language,
  TrainingSession,
  VoiceModel,
} from '../types';
import { translate, type TranslationKey } from '../i18n/translations';
import * as db from '../services/db';
import {
  clearSession,
  createSession,
  deriveStatus,
  loadSession,
  probeSession,
  type UrlValidation,
  validateSessionUrl,
} from '../services/colab/colabService';

const SETTINGS_KEY = 'abbasapplio:settings:v1';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'ar',
  accent: 'violet',
  consentConfirmed: false,
  consentConfirmedAt: null,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface AppState {
  t: (key: TranslationKey) => string;
  lang: Language;
  setLanguage: (lang: Language) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  colab: ColabSession | null;
  linkColab: (rawUrl: string) => { session: ColabSession | null; validation: UrlValidation };
  unlinkColab: () => void;
  refreshColab: () => Promise<void>;
  probing: boolean;
  models: VoiceModel[];
  refreshModels: () => Promise<void>;
  projects: AudioProject[];
  refreshProjects: () => Promise<void>;
  jobs: ConversionJob[];
  refreshJobs: () => Promise<void>;
  trainingSessions: TrainingSession[];
  refreshTraining: () => Promise<void>;
  loaded: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [colab, setColab] = useState<ColabSession | null>(() => loadSession());
  const [probing, setProbing] = useState(false);
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [projects, setProjects] = useState<AudioProject[]>([]);
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refreshModels = useCallback(async () => {
    const all = await db.listModels();
    setModels(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);
  const refreshProjects = useCallback(async () => {
    const all = await db.listProjects();
    setProjects(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, []);
  const refreshJobs = useCallback(async () => {
    const all = await db.listJobs();
    setJobs(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);
  const refreshTraining = useCallback(async () => {
    const all = await db.listTrainingSessions();
    setTrainingSessions(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([refreshModels(), refreshProjects(), refreshJobs(), refreshTraining()]);
      setLoaded(true);
    })();
  }, [refreshModels, refreshProjects, refreshJobs, refreshTraining]);

  // Keep <html lang/dir> in sync with the chosen language (RTL for Arabic).
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.accent = settings.accent;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const t = useCallback((key: TranslationKey) => translate(settings.language, key), [settings.language]);

  const setLanguage = useCallback((lang: Language) => {
    setSettings((s) => ({ ...s, language: lang }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const linkColab = useCallback((rawUrl: string) => {
    const validation = validateSessionUrl(rawUrl);
    if (!validation.ok || !validation.normalizedUrl || !validation.method) {
      return { session: null, validation };
    }
    const session = createSession(validation.normalizedUrl, validation.method);
    setColab(session);
    return { session, validation };
  }, []);

  const unlinkColab = useCallback(() => {
    clearSession();
    setColab(null);
  }, []);

  const refreshColab = useCallback(async () => {
    setColab((current) => {
      if (!current) return current;
      return { ...current, status: deriveStatus(current) };
    });
    setProbing(true);
    try {
      const current = loadSession();
      if (current) {
        const updated = await probeSession(current);
        setColab(updated);
      }
    } finally {
      setProbing(false);
    }
  }, []);

  const value = useMemo<AppState>(
    () => ({
      t,
      lang: settings.language,
      setLanguage,
      settings,
      updateSettings,
      colab,
      linkColab,
      unlinkColab,
      refreshColab,
      probing,
      models,
      refreshModels,
      projects,
      refreshProjects,
      jobs,
      refreshJobs,
      trainingSessions,
      refreshTraining,
      loaded,
    }),
    [
      t,
      settings,
      setLanguage,
      updateSettings,
      colab,
      linkColab,
      unlinkColab,
      refreshColab,
      probing,
      models,
      refreshModels,
      projects,
      refreshProjects,
      jobs,
      refreshJobs,
      trainingSessions,
      refreshTraining,
      loaded,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
