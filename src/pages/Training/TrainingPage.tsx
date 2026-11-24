import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, GraduationCap } from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Badge, Button, Card, Field, Notice, PageHeader, inputClass } from '../../components/common/ui';
import { EmptyState } from '../../components/common/EmptyState';
import { AudioUploader } from '../../components/uploads/AudioUploader';
import { ACCEPTED_AUDIO, analyzeAudioFile, formatBytes, formatDuration, type AudioAnalysis } from '../../services/audio/audioAnalysis';
import { TRAINING_SAMPLE_RATES } from '../../services/applio/applioAdapter';
import { deleteTrainingSession, generateId, saveTrainingSession } from '../../services/db';
import type { ProjectFile, TrainingSession, TrainingStatus } from '../../types';

interface CheckedFile extends ProjectFile {
  analysis?: AudioAnalysis;
  error?: boolean;
}

const STATUS_TONE: Record<TrainingStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  'waiting-colab': 'neutral',
  'in-progress': 'info',
  completed: 'success',
  failed: 'danger',
  interrupted: 'warning',
};

const STATUS_KEY: Record<TrainingStatus, 'jobStatusWaiting' | 'jobStatusInProgress' | 'jobStatusCompleted' | 'jobStatusFailed' | 'jobStatusInterrupted'> = {
  'waiting-colab': 'jobStatusWaiting',
  'in-progress': 'jobStatusInProgress',
  completed: 'jobStatusCompleted',
  failed: 'jobStatusFailed',
  interrupted: 'jobStatusInterrupted',
};

export function TrainingPage() {
  const { t, colab, trainingSessions, refreshTraining, settings } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [files, setFiles] = useState<CheckedFile[]>([]);
  const [checking, setChecking] = useState(false);
  const [epochs, setEpochs] = useState(200);
  const [batchSize, setBatchSize] = useState(8);
  const [sampleRate, setSampleRate] = useState<32000 | 40000 | 48000>(40000);
  const [saveEvery, setSaveEvery] = useState(10);
  const [notice, setNotice] = useState<string | null>(null);

  const totalDuration = useMemo(
    () => files.reduce((sum, f) => sum + (f.analysis?.durationSec ?? 0), 0),
    [files],
  );
  const hasQualityIssue = files.some(
    (f) => f.error || (f.analysis && (f.analysis.clippingRatio > 0.001 || f.analysis.peak < 0.1)),
  );

  const handleFiles = async (picked: File[]) => {
    setChecking(true);
    const checked: CheckedFile[] = [];
    for (const file of picked) {
      const base: CheckedFile = {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        blob: file,
        addedAt: new Date().toISOString(),
      };
      try {
        const analysis = await analyzeAudioFile(file);
        checked.push({ ...base, analysis, durationSec: analysis.durationSec });
      } catch {
        checked.push({ ...base, error: true });
      }
    }
    setFiles((prev) => [...prev, ...checked]);
    setChecking(false);
  };

  const handleSave = async () => {
    if (!name.trim() || files.length === 0) return;
    if (!settings.consentConfirmed) {
      setNotice(t('consentRequired'));
      return;
    }
    const session: TrainingSession = {
      id: generateId(),
      name: name.trim(),
      datasetFiles: files,
      epochs,
      batchSize,
      sampleRate,
      saveEveryEpochs: saveEvery,
      totalEpochs: epochs,
      status: 'waiting-colab',
      confirmedEpochs: 0,
      note: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTrainingSession(session);
    await refreshTraining();
    setNotice(t('trainingSaved'));
    setName('');
    setFiles([]);
  };

  const updateStatus = async (s: TrainingSession, status: TrainingStatus) => {
    await saveTrainingSession({ ...s, status, updatedAt: new Date().toISOString() });
    await refreshTraining();
  };

  const updateEpochs = async (s: TrainingSession, confirmed: number) => {
    const clamped = Math.max(0, Math.min(s.totalEpochs, confirmed));
    await saveTrainingSession({
      ...s,
      confirmedEpochs: clamped,
      status: clamped >= s.totalEpochs ? 'completed' : s.status,
      updatedAt: new Date().toISOString(),
    });
    await refreshTraining();
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('trainingTitle')} subtitle={t('trainingSubtitle')} />

      {!colab && (
        <Notice tone="warning" title={t('statusDisconnected')}>
          {t('jobNeedsColab')}{' '}
          <button type="button" className="font-semibold underline" onClick={() => navigate('/colab')}>
            {t('connectColab')}
          </button>
        </Notice>
      )}
      {notice && (
        <Notice tone="success">
          {notice}
          <button type="button" className="ms-2 font-semibold underline" onClick={() => setNotice(null)}>
            {t('close')}
          </button>
        </Notice>
      )}

      {/* Step 1: dataset */}
      <Card>
        <h2 className="mb-1 text-sm font-bold">{t('stepDataset')}</h2>
        <p className="mb-3 text-xs leading-relaxed text-mist-500">{t('datasetHint')}</p>
        <AudioUploader accept={ACCEPTED_AUDIO} multiple label={t('addRecordings')} onFiles={handleFiles} />
        {checking && <p className="mt-3 text-xs text-mist-500">{t('analyzing')}</p>}
        {files.length > 0 && (
          <p className="mt-3 text-xs font-medium">
            {t('totalDuration')}: <span dir="ltr">{formatDuration(totalDuration)}</span> · {files.length} {t('filesCount')}
          </p>
        )}
      </Card>

      {/* Step 2: quality check */}
      {files.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-bold">{t('stepCheck')}</h2>
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="rounded-xl border border-white/5 bg-night-800 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium" dir="ltr">
                    {f.name}
                  </p>
                  {f.error ? (
                    <Badge tone="danger">{t('error')}</Badge>
                  ) : f.analysis ? (
                    f.analysis.clippingRatio > 0.001 || f.analysis.peak < 0.1 ? (
                      <Badge tone="warning">{t('qualityWarn')}</Badge>
                    ) : (
                      <Badge tone="success">{t('qualityGood')}</Badge>
                    )
                  ) : null}
                </div>
                {f.analysis && (
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-mist-500 sm:grid-cols-4">
                    <div>
                      <dt>{t('duration')}</dt>
                      <dd className="text-mist-100" dir="ltr">{formatDuration(f.analysis.durationSec)}</dd>
                    </div>
                    <div>
                      <dt>{t('sampleRate')}</dt>
                      <dd className="text-mist-100" dir="ltr">{f.analysis.sampleRate} Hz</dd>
                    </div>
                    <div>
                      <dt>{t('peakLevel')}</dt>
                      <dd className="text-mist-100" dir="ltr">{(f.analysis.peak * 100).toFixed(0)}%</dd>
                    </div>
                    <div>
                      <dt>{t('clipping')}</dt>
                      <dd className="text-mist-100" dir="ltr">{(f.analysis.clippingRatio * 100).toFixed(2)}%</dd>
                    </div>
                  </dl>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-mist-600">{formatBytes(f.size)}</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-300 hover:underline"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasQualityIssue && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t('qualityWarn')}: {t('clipping')} / {t('peakLevel')}
            </p>
          )}
        </Card>
      )}

      {/* Step 3: parameters */}
      <Card>
        <h2 className="mb-4 text-sm font-bold">{t('stepParams')}</h2>
        <div className="space-y-4">
          <Field label={`${t('name')} — ${t('required')}`}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name')} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('epochs')}>
              <input
                type="number"
                min={10}
                max={2000}
                step={10}
                value={epochs}
                onChange={(e) => setEpochs(Math.max(10, Number(e.target.value) || 10))}
                className={inputClass}
                dir="ltr"
              />
            </Field>
            <Field label={t('batchSize')}>
              <input
                type="number"
                min={1}
                max={32}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value) || 1))}
                className={inputClass}
                dir="ltr"
              />
            </Field>
            <Field label={t('sampleRate')}>
              <select
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value) as 32000 | 40000 | 48000)}
                className={inputClass}
                dir="ltr"
              >
                {TRAINING_SAMPLE_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r} Hz
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('saveEvery')}>
              <input
                type="number"
                min={1}
                max={100}
                value={saveEvery}
                onChange={(e) => setSaveEvery(Math.max(1, Number(e.target.value) || 1))}
                className={inputClass}
                dir="ltr"
              />
            </Field>
          </div>
          <Button onClick={handleSave} disabled={!name.trim() || files.length === 0} className="w-full">
            <GraduationCap className="h-4 w-4" />
            {t('createTrainingSession')}
          </Button>
          {!settings.consentConfirmed && (
            <p className="text-center text-xs leading-relaxed text-amber-300">{t('consentRequired')}</p>
          )}
        </div>
      </Card>

      {/* Sessions */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-mist-300">{t('stepRun')}</h2>
        {trainingSessions.length === 0 ? (
          <EmptyState title={t('noJobsYet')} />
        ) : (
          <div className="space-y-3">
            {trainingSessions.map((s) => (
              <Card key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{s.name}</p>
                    <p className="mt-0.5 text-xs text-mist-500">
                      {s.datasetFiles.length} {t('filesCount')} · {s.epochs} {t('epochs')} ·{' '}
                      <span dir="ltr">{s.sampleRate} Hz</span>
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[s.status]}>{t(STATUS_KEY[s.status])}</Badge>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-mist-500">
                    <span>{t('confirmedEpochs')}</span>
                    <span dir="ltr">
                      {s.confirmedEpochs} / {s.totalEpochs}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-night-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-iris-500 to-indigo-600 transition-all"
                      style={{ width: `${s.totalEpochs ? (s.confirmedEpochs / s.totalEpochs) * 100 : 0}%` }}
                    />
                  </div>
                  {s.status === 'in-progress' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={s.totalEpochs}
                        defaultValue={s.confirmedEpochs}
                        className={`${inputClass} w-28 py-1.5`}
                        dir="ltr"
                        aria-label={t('confirmedEpochs')}
                        onBlur={(e) => void updateEpochs(s, Number(e.target.value))}
                      />
                      <span className="text-xs text-mist-500">{t('updateProgress')}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {colab && s.status === 'waiting-colab' && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(colab.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('openApplio')}
                    </Button>
                  )}
                  {s.status === 'waiting-colab' && (
                    <Button variant="secondary" onClick={() => updateStatus(s, 'in-progress')}>
                      {t('markInProgress')}
                    </Button>
                  )}
                  {s.status === 'in-progress' && (
                    <>
                      <Button variant="secondary" onClick={() => updateStatus(s, 'completed')}>
                        <CheckCircle2 className="h-4 w-4" />
                        {t('jobStatusCompleted')}
                      </Button>
                      <Button variant="ghost" onClick={() => updateStatus(s, 'failed')}>
                        {t('markFailed')}
                      </Button>
                      <Button variant="ghost" onClick={() => updateStatus(s, 'interrupted')}>
                        {t('markInterrupted')}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (window.confirm(t('deleteConfirm'))) {
                        await deleteTrainingSession(s.id);
                        await refreshTraining();
                      }
                    }}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
