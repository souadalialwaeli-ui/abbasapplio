import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Trash2 } from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Badge, Button, PageHeader, inputClass } from '../../components/common/ui';
import { EmptyState } from '../../components/common/EmptyState';
import { WaveformPlayer } from '../../components/audio/WaveformPlayer';
import { formatBytes } from '../../services/audio/audioAnalysis';
import { deleteJob } from '../../services/db';
import type { JobStatus } from '../../types';

const STATUS_TONE: Record<JobStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  'waiting-colab': 'neutral',
  'in-progress': 'info',
  completed: 'success',
  failed: 'danger',
  interrupted: 'warning',
};

const STATUS_KEY: Record<JobStatus, 'jobStatusWaiting' | 'jobStatusInProgress' | 'jobStatusCompleted' | 'jobStatusFailed' | 'jobStatusInterrupted'> = {
  'waiting-colab': 'jobStatusWaiting',
  'in-progress': 'jobStatusInProgress',
  completed: 'jobStatusCompleted',
  failed: 'jobStatusFailed',
  interrupted: 'jobStatusInterrupted',
};

export function HistoryPage() {
  const { t, lang, jobs, refreshJobs } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      jobs.filter((j) => {
        if (filter !== 'all' && j.status !== filter) return false;
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          j.name.toLowerCase().includes(q) ||
          j.inputFileName.toLowerCase().includes(q) ||
          (j.modelName ?? '').toLowerCase().includes(q)
        );
      }),
    [jobs, filter, query],
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t('historyTitle')} subtitle={t('historySubtitle')} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          className={`${inputClass} flex-1`}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as JobStatus | 'all')}
          className={`${inputClass} sm:w-48`}
        >
          <option value="all">{t('allStatuses')}</option>
          {(Object.keys(STATUS_KEY) as JobStatus[]).map((s) => (
            <option key={s} value={s}>
              {t(STATUS_KEY[s])}
            </option>
          ))}
        </select>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-6 w-6" />}
          title={t('noHistory')}
          body={t('historySubtitle')}
          action={<Button onClick={() => navigate('/conversion')}>{t('startConversion')}</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('noResults')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="rounded-2xl border border-white/5 bg-night-900 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{job.name}</p>
                  <p className="mt-0.5 text-xs text-mist-500">
                    {new Date(job.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')} ·{' '}
                    {job.modelName ?? t('noModelSelected')}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[job.status]}>{t(STATUS_KEY[job.status])}</Badge>
              </div>

              <p className="mt-2 truncate text-xs text-mist-500" dir="ltr">
                {job.inputFileName} · {formatBytes(job.inputSize)}
                {job.outputFileName ? ` → ${job.outputFileName}` : ''}
              </p>

              {job.outputBlob && (
                <div className="mt-3">
                  <WaveformPlayer blob={job.outputBlob} fileName={job.outputFileName ?? ''} compact />
                </div>
              )}

              {job.note && (
                <p className="mt-3 rounded-xl bg-night-800 px-3 py-2 text-xs leading-relaxed text-mist-300">
                  {job.note}
                </p>
              )}

              <div className="mt-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(t('deleteConfirm'))) {
                      await deleteJob(job.id);
                      await refreshJobs();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-300 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('deleteJob')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
