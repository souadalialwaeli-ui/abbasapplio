/**
 * Local persistence via IndexedDB (idb-keyval).
 *
 * Three stores: voice models, audio projects, conversion jobs (+ training
 * sessions live in the jobs store under their own key prefix).
 * Blobs (audio files, .pth/.index files) are stored alongside metadata so
 * the app works fully offline. Nothing leaves the device.
 */
import { createStore, del, get, set, values, clear } from 'idb-keyval';
import type { AudioProject, ConversionJob, TrainingSession, VoiceModel } from '../types';

const modelsStore = createStore('abbasapplio-db', 'models');
const projectsStore = createStore('abbasapplio-db', 'projects');
const jobsStore = createStore('abbasapplio-db', 'jobs');
const trainingStore = createStore('abbasapplio-db', 'training');

// --- Voice models ---------------------------------------------------------
export const listModels = () => values<VoiceModel>(modelsStore);
export const getModel = (id: string) => get<VoiceModel>(id, modelsStore);
export const saveModel = (model: VoiceModel) => set(model.id, model, modelsStore);
export const deleteModel = (id: string) => del(id, modelsStore);

// --- Projects -------------------------------------------------------------
export const listProjects = () => values<AudioProject>(projectsStore);
export const saveProject = (project: AudioProject) => set(project.id, project, projectsStore);
export const deleteProject = (id: string) => del(id, projectsStore);

// --- Conversion jobs ------------------------------------------------------
export const listJobs = () => values<ConversionJob>(jobsStore);
export const saveJob = (job: ConversionJob) => set(job.id, job, jobsStore);
export const deleteJob = (id: string) => del(id, jobsStore);

// --- Training sessions ----------------------------------------------------
export const listTrainingSessions = () => values<TrainingSession>(trainingStore);
export const saveTrainingSession = (s: TrainingSession) => set(s.id, s, trainingStore);
export const deleteTrainingSession = (id: string) => del(id, trainingStore);

// --- Maintenance ----------------------------------------------------------
export async function clearAllLocalData(): Promise<void> {
  await Promise.all([
    clear(modelsStore),
    clear(projectsStore),
    clear(jobsStore),
    clear(trainingStore),
  ]);
  // Keep the Colab link separate: it lives in localStorage and is cleared
  // explicitly from the Colab page, not as a side effect of wiping data.
}

export async function storageEstimate(): Promise<{ usage: number; quota: number }> {
  if (!navigator.storage?.estimate) return { usage: 0, quota: 0 };
  const est = await navigator.storage.estimate();
  return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
