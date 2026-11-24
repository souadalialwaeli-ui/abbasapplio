import { useEffect, useState } from 'react';
import { Check, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Button, Card, Notice, PageHeader } from '../../components/common/ui';
import { clearAllLocalData, storageEstimate } from '../../services/db';
import { APPLIO_DOCS_URL, APPLIO_REPO_URL, APPLIO_TERMS_URL, COLAB_NOTEBOOK_URL } from '../../services/colab/colabService';
import { formatBytes } from '../../services/audio/audioAnalysis';
import type { Accent, Language } from '../../types';

const ACCENTS: { value: Accent; label: string; swatch: string }[] = [
  { value: 'violet', label: 'Violet', swatch: '#8b5cf6' },
  { value: 'indigo', label: 'Indigo', swatch: '#6366f1' },
  { value: 'fuchsia', label: 'Fuchsia', swatch: '#d946ef' },
];

export function SettingsPage() {
  const { t, lang, setLanguage, settings, updateSettings, refreshModels, refreshProjects, refreshJobs, refreshTraining } = useApp();
  const [usage, setUsage] = useState<{ usage: number; quota: number }>({ usage: 0, quota: 0 });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void storageEstimate().then(setUsage);
  }, []);

  const handleClear = async () => {
    if (!window.confirm(t('clearDataConfirm'))) return;
    await clearAllLocalData();
    await Promise.all([refreshModels(), refreshProjects(), refreshJobs(), refreshTraining()]);
    setUsage(await storageEstimate());
    setNotice(t('dataCleared'));
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('settingsTitle')} subtitle={t('settingsSubtitle')} />

      {notice && (
        <Notice tone="success">
          {notice}
          <button type="button" className="ms-2 font-semibold underline" onClick={() => setNotice(null)}>
            {t('close')}
          </button>
        </Notice>
      )}

      {/* Language */}
      <Card>
        <h2 className="mb-3 text-sm font-bold">{t('language')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: 'ar', label: t('arabic') },
              { value: 'en', label: t('english') },
            ] as { value: Language; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLanguage(opt.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                lang === opt.value
                  ? 'border-iris-500/60 bg-iris-500/10 text-iris-200'
                  : 'border-white/10 bg-night-800 text-mist-300 hover:border-white/20'
              }`}
              aria-pressed={lang === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Accent */}
      <Card>
        <h2 className="mb-3 text-sm font-bold">{t('accent')}</h2>
        <div className="flex gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => updateSettings({ accent: a.value })}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition ${
                settings.accent === a.value ? 'border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: a.swatch }}
              aria-label={a.label}
              aria-pressed={settings.accent === a.value}
            >
              {settings.accent === a.value && <Check className="h-5 w-5 text-white" />}
            </button>
          ))}
        </div>
      </Card>

      {/* Consent */}
      <Card>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          {t('consentTitle')}
        </h2>
        <p className="text-xs leading-relaxed text-mist-300">{t('consentBody')}</p>
        <div className="mt-3">
          {settings.consentConfirmed ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <Check className="h-4 w-4" />
              {t('consentConfirmed')}
            </p>
          ) : (
            <Button
              variant="outline"
              onClick={() =>
                updateSettings({ consentConfirmed: true, consentConfirmedAt: new Date().toISOString() })
              }
            >
              {t('consentTitle')}
            </Button>
          )}
        </div>
      </Card>

      {/* Storage */}
      <Card>
        <h2 className="mb-3 text-sm font-bold">{t('storage')}</h2>
        <div className="rounded-xl bg-night-800 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-mist-500">{t('storageUsed')}</span>
            <span className="font-semibold" dir="ltr">
              {formatBytes(usage.usage)}
              {usage.quota > 0 ? ` / ${formatBytes(usage.quota)}` : ''}
            </span>
          </div>
          {usage.quota > 0 && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-night-700">
              <div
                className="h-full rounded-full bg-gradient-to-l from-iris-500 to-indigo-600"
                style={{ width: `${Math.min(100, (usage.usage / usage.quota) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <Button variant="danger" onClick={handleClear} className="mt-3">
          <Trash2 className="h-4 w-4" />
          {t('clearData')}
        </Button>
      </Card>

      {/* About */}
      <Card>
        <h2 className="mb-2 text-sm font-bold">{t('aboutTitle')}</h2>
        <p className="text-xs leading-relaxed text-mist-300">{t('aboutBody')}</p>
        <p className="mt-3 text-xs text-mist-500">
          {t('version')}: <span dir="ltr">0.1.0</span>
        </p>
        <h3 className="mb-2 mt-4 text-xs font-bold text-mist-300">{t('openSourceLinks')}</h3>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Applio — GitHub', href: APPLIO_REPO_URL },
            { label: 'Applio — Docs', href: APPLIO_DOCS_URL },
            { label: 'Applio — Terms of Use', href: APPLIO_TERMS_URL },
            { label: 'Applio — Colab notebook', href: COLAB_NOTEBOOK_URL },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-iris-300 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {link.label}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
