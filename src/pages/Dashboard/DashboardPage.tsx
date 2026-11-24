import { Link, useNavigate } from 'react-router-dom';
import {
  AudioWaveform,
  ChevronLeft,
  FolderKanban,
  GraduationCap,
  History,
  Mic2,
  PlugZap,
} from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import type { TranslationKey } from '../../i18n/translations';
import { Badge, Button, Card } from '../../components/common/ui';
import { EmptyState } from '../../components/common/EmptyState';
import { Logo } from '../../components/layout/Logo';
import { formatBytes } from '../../services/audio/audioAnalysis';

function statusBadge(status: string, t: (k: TranslationKey) => string) {
  switch (status) {
    case 'linked':
      return <Badge tone="success">{t('statusLinked')}</Badge>;
    case 'unverified':
      return <Badge tone="warning">{t('statusUnverified')}</Badge>;
    case 'expired':
      return <Badge tone="danger">{t('statusExpired')}</Badge>;
    default:
      return <Badge>{t('statusDisconnected')}</Badge>;
  }
}

export function DashboardPage() {
  const { t, colab, models, projects, jobs } = useApp();
  const navigate = useNavigate();

  const recentProjects = projects.slice(0, 3);
  const recentJobs = jobs.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="gradient-border rounded-3xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Logo size={52} />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-snug sm:text-2xl">
              {t('dashboardWelcome')} <span className="gradient-text">abbasapplio</span>
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-mist-300">{t('dashboardSubtitle')}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-night-950/60 p-3 text-center">
            <Mic2 className="mx-auto mb-1 h-5 w-5 text-iris-400" />
            <p className="text-lg font-bold tabular-nums">{models.length}</p>
            <p className="text-[11px] text-mist-500">{t('savedModels')}</p>
          </div>
          <div className="rounded-2xl bg-night-950/60 p-3 text-center">
            <FolderKanban className="mx-auto mb-1 h-5 w-5 text-iris-400" />
            <p className="text-lg font-bold tabular-nums">{projects.length}</p>
            <p className="text-[11px] text-mist-500">{t('totalProjects')}</p>
          </div>
          <div className="rounded-2xl bg-night-950/60 p-3 text-center">
            <History className="mx-auto mb-1 h-5 w-5 text-iris-400" />
            <p className="text-lg font-bold tabular-nums">{jobs.length}</p>
            <p className="text-[11px] text-mist-500">{t('totalJobs')}</p>
          </div>
        </div>
      </section>

      {/* Colab status */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-iris-500/10 text-iris-400">
              <PlugZap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('colabStatus')}</p>
              <p className="mt-0.5 text-xs text-mist-500">
                {colab ? colab.url : t('colabNotConnected')}
              </p>
            </div>
          </div>
          {statusBadge(colab?.status ?? 'disconnected', t)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/colab')}>
            {colab ? t('checkSession') : t('connectColab')}
          </Button>
          {colab && (
            <Button
              variant="secondary"
              onClick={() => window.open(colab.url, '_blank', 'noopener,noreferrer')}
            >
              {t('openApplio')}
            </Button>
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-mist-300">{t('quickActions')}</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/conversion')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-night-900 p-4 text-center transition hover:border-iris-500/40"
          >
            <AudioWaveform className="h-6 w-6 text-iris-400" />
            <span className="text-xs font-semibold leading-tight">{t('startConversion')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/training')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-night-900 p-4 text-center transition hover:border-iris-500/40"
          >
            <GraduationCap className="h-6 w-6 text-iris-400" />
            <span className="text-xs font-semibold leading-tight">{t('startTraining')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/models')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-night-900 p-4 text-center transition hover:border-iris-500/40"
          >
            <Mic2 className="h-6 w-6 text-iris-400" />
            <span className="text-xs font-semibold leading-tight">{t('navModels')}</span>
          </button>
        </div>
      </section>

      {/* Recent projects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-mist-300">{t('recentProjects')}</h2>
          <Link to="/projects" className="flex items-center gap-1 text-xs font-medium text-iris-300">
            {t('viewAll')}
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <EmptyState title={t('noProjectsYet')} action={<Button onClick={() => navigate('/projects')}>{t('createProject')}</Button>} />
        ) : (
          <div className="space-y-2">
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                to="/projects"
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-night-900 px-4 py-3 transition hover:border-iris-500/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-mist-500">
                    {p.files.length} {t('filesCount')}
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 shrink-0 text-mist-600 rtl:rotate-180" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent jobs */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-mist-300">{t('recentJobs')}</h2>
          <Link to="/history" className="flex items-center gap-1 text-xs font-medium text-iris-300">
            {t('viewAll')}
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <EmptyState
            title={t('noJobsYet')}
            action={<Button onClick={() => navigate('/conversion')}>{t('startConversion')}</Button>}
          />
        ) : (
          <div className="space-y-2">
            {recentJobs.map((j) => (
              <Link
                key={j.id}
                to="/history"
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-night-900 px-4 py-3 transition hover:border-iris-500/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{j.name}</p>
                  <p className="truncate text-xs text-mist-500" dir="ltr">
                    {j.inputFileName} · {formatBytes(j.inputSize)}
                  </p>
                </div>
                <Badge
                  tone={
                    j.status === 'completed'
                      ? 'success'
                      : j.status === 'failed'
                        ? 'danger'
                        : j.status === 'in-progress'
                          ? 'info'
                          : j.status === 'interrupted'
                            ? 'warning'
                            : 'neutral'
                  }
                >
                  {t(
                    j.status === 'completed'
                      ? 'jobStatusCompleted'
                      : j.status === 'failed'
                        ? 'jobStatusFailed'
                        : j.status === 'in-progress'
                          ? 'jobStatusInProgress'
                          : j.status === 'interrupted'
                            ? 'jobStatusInterrupted'
                            : 'jobStatusWaiting',
                  )}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
