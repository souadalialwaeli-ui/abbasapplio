import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Link2,
  PlugZap,
  RefreshCw,
  Unplug,
} from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Badge, Button, Card, Field, Notice, PageHeader, inputClass } from '../../components/common/ui';
import {
  COLAB_NOTEBOOK_URL,
  SESSION_MAX_AGE_MS,
} from '../../services/colab/colabService';

const STEPS = [
  { titleKey: 'step1Title', bodyKey: 'step1Body' },
  { titleKey: 'step2Title', bodyKey: 'step2Body' },
  { titleKey: 'step3Title', bodyKey: 'step3Body' },
  { titleKey: 'step4Title', bodyKey: 'step4Body' },
  { titleKey: 'step5Title', bodyKey: 'step5Body' },
] as const;

const TROUBLE = [
  { q: 'trouble1Q', a: 'trouble1A' },
  { q: 'trouble2Q', a: 'trouble2A' },
  { q: 'trouble3Q', a: 'trouble3A' },
  { q: 'trouble4Q', a: 'trouble4A' },
] as const;

export function ColabPage() {
  const { t, lang, colab, linkColab, unlinkColab, refreshColab, probing } = useApp();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [openTrouble, setOpenTrouble] = useState<number | null>(null);

  const handleLink = () => {
    setError(null);
    setMessage(null);
    const { session } = linkColab(url);
    if (!session) {
      setError(t('urlInvalid'));
      return;
    }
    setUrl('');
    setMessage(t('sessionLinked'));
  };

  const handleCheck = async () => {
    setMessage(null);
    await refreshColab();
  };

  const ageMs = colab ? Date.now() - new Date(colab.linkedAt).getTime() : 0;
  const ageHours = Math.floor(ageMs / 3_600_000);
  const nearExpiry = colab && ageMs > SESSION_MAX_AGE_MS * 0.75;

  const probeNote =
    colab?.lastProbe === 'reachable'
      ? t('probeReachable')
      : colab?.lastProbe === 'unreachable'
        ? t('probeUnreachable')
        : colab?.lastProbe === 'unknown'
          ? t('probeUnknown')
          : null;

  return (
    <div className="space-y-5">
      <PageHeader title={t('colabTitle')} subtitle={t('colabSubtitle')} />

      {/* Current session status */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-iris-500/10 text-iris-400">
              <PlugZap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('colabStatus')}</p>
              <p className="text-xs text-mist-500" dir="ltr">
                {colab ? colab.url : '—'}
              </p>
            </div>
          </div>
          <Badge
            tone={
              colab?.status === 'linked'
                ? 'success'
                : colab?.status === 'unverified'
                  ? 'warning'
                  : colab?.status === 'expired'
                    ? 'danger'
                    : 'neutral'
            }
          >
            {t(
              colab?.status === 'linked'
                ? 'statusLinked'
                : colab?.status === 'unverified'
                  ? 'statusUnverified'
                  : colab?.status === 'expired'
                    ? 'statusExpired'
                    : 'statusDisconnected',
            )}
          </Badge>
        </div>

        {colab && (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-night-800 p-3">
              <dt className="text-mist-500">{t('linkedAt')}</dt>
              <dd className="mt-1 font-medium">
                {new Date(colab.linkedAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
              </dd>
            </div>
            <div className="rounded-xl bg-night-800 p-3">
              <dt className="text-mist-500">{t('lastChecked')}</dt>
              <dd className="mt-1 font-medium">
                {colab.lastCheckedAt
                  ? new Date(colab.lastCheckedAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')
                  : '—'}
              </dd>
            </div>
          </dl>
        )}

        {probeNote && (
          <div className="mt-4">
            <Notice tone={colab?.lastProbe === 'unreachable' ? 'danger' : 'info'}>{probeNote}</Notice>
          </div>
        )}

        {nearExpiry && (
          <div className="mt-4">
            <Notice tone="warning" title={`${ageHours}h`}>
              {t('sessionAgeWarning')}
            </Notice>
          </div>
        )}

        {message && (
          <div className="mt-4">
            <Notice tone="success">{message}</Notice>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {colab && (
            <>
              <Button onClick={() => window.open(colab.url, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="h-4 w-4" />
                {t('openApplio')}
              </Button>
              <Button variant="secondary" onClick={handleCheck} disabled={probing}>
                <RefreshCw className={`h-4 w-4 ${probing ? 'animate-spin' : ''}`} />
                {probing ? t('checking') : t('checkSession')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  unlinkColab();
                  setMessage(t('sessionUnlinked'));
                }}
              >
                <Unplug className="h-4 w-4" />
                {t('unlinkSession')}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Link a session */}
      <Card>
        <Field label={t('pasteUrlLabel')} hint={t('step4Body')}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              inputMode="url"
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('pasteUrlPlaceholder')}
              className={`${inputClass} text-left`}
              autoComplete="off"
              spellCheck={false}
            />
            <Button onClick={handleLink} className="shrink-0">
              <Link2 className="h-4 w-4" />
              {t('linkSession')}
            </Button>
          </div>
        </Field>
        {error && (
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </Card>

      {/* Guided steps */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-mist-300">{t('openNotebook')}</h2>
        <div className="space-y-2.5">
          {STEPS.map((step, i) => (
            <div key={step.titleKey} className="flex gap-3 rounded-2xl border border-white/5 bg-night-900 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-iris-500/15 text-sm font-bold text-iris-300">
                {i + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t(step.titleKey)}</p>
                <p className="mt-1 text-xs leading-relaxed text-mist-500">{t(step.bodyKey)}</p>
                {i === 0 && (
                  <a
                    href={COLAB_NOTEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-l from-iris-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('openNotebook')}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Limits */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          {t('colabLimitsTitle')}
        </h2>
        <ul className="space-y-2 text-xs leading-relaxed text-mist-300">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist-500" />
            {t('colabLimit1')}
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist-500" />
            {t('colabLimit2')}
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist-500" />
            {t('colabLimit3')}
          </li>
        </ul>
      </Card>

      {/* Troubleshooting */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-mist-300">{t('troubleshootingTitle')}</h2>
        <div className="space-y-2">
          {TROUBLE.map((item, i) => (
            <div key={item.q} className="overflow-hidden rounded-2xl border border-white/5 bg-night-900">
              <button
                type="button"
                onClick={() => setOpenTrouble(openTrouble === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start text-sm font-semibold"
                aria-expanded={openTrouble === i}
              >
                {t(item.q)}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-mist-500 transition-transform ${openTrouble === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openTrouble === i && (
                <p className="border-t border-white/5 px-4 py-3 text-xs leading-relaxed text-mist-300">
                  {t(item.a)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
