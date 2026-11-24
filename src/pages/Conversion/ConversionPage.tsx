import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioWaveform, Check, Copy, Download, ExternalLink, Mic2 } from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Badge, Button, Card, Field, Notice, PageHeader, inputClass } from '../../components/common/ui';
import { EmptyState } from '../../components/common/EmptyState';
import { AudioUploader } from '../../components/uploads/AudioUploader';
import { WaveformPlayer } from '../../components/audio/WaveformPlayer';
import { ACCEPTED_AUDIO, analyzeAudioFile, formatBytes } from '../../services/audio/audioAnalysis';
import { CONVERSION_RANGES, F0_METHODS, RESAMPLE_RATES, settingsSummary } from '../../services/applio/applioAdapter';
import { deleteJob, generateId, saveJob } from '../../services/db';
import type { ConversionJob, ConversionSettings, JobStatus } from '../../types';
import { DEFAULT_CONVERSION_SETTINGS } from '../../types';

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

export function ConversionPage() {
  const { t, colab, models, jobs, refreshJobs, settings } = useApp();
  const navigate = useNavigate();

  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputDuration, setInputDuration] = useState<number | undefined>(undefined);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelId, setModelId] = useState<string>('');
  const [jobName, setJobName] = useState('');
  const [note, setNote] = useState('');
  const [conv, setConv] = useState<ConversionSettings>(DEFAULT_CONVERSION_SETTINGS);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const outputInputRef = useRef<HTMLInputElement>(null);
  const [attachingTo, setAttachingTo] = useState<string | null>(null);

  const selectedModel = useMemo(() => models.find((m) => m.id === modelId) ?? null, [models, modelId]);
  const canSave = Boolean(inputFile && modelId && jobName.trim());

  const handleInputFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setInputFile(file);
    setAnalyzing(true);
    try {
      const analysis = await analyzeAudioFile(file);
      setInputDuration(analysis.durationSec);
    } catch {
      setInputDuration(undefined);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveJob = async () => {
    if (!inputFile || !selectedModel) return;
    if (!settings.consentConfirmed) {
      setNotice(t('consentRequired'));
      return;
    }
    const job: ConversionJob = {
      id: generateId(),
      name: jobName.trim(),
      inputFileName: inputFile.name,
      inputSize: inputFile.size,
      inputBlob: inputFile,
      inputDurationSec: inputDuration,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      settings: conv,
      status: 'waiting-colab',
      outputFileName: null,
      outputSize: null,
      note: note.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveJob(job);
    await refreshJobs();
    setNotice(t('jobPrepared'));
    setInputFile(null);
    setJobName('');
    setNote('');
  };

  const updateJobStatus = async (job: ConversionJob, status: JobStatus) => {
    await saveJob({ ...job, status, updatedAt: new Date().toISOString() });
    await refreshJobs();
  };

  const handleAttachOutput = async (job: ConversionJob, file: File) => {
    await saveJob({
      ...job,
      status: 'completed',
      outputFileName: file.name,
      outputSize: file.size,
      outputBlob: file,
      updatedAt: new Date().toISOString(),
    });
    await refreshJobs();
    setAttachingTo(null);
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const copySettings = async () => {
    try {
      await navigator.clipboard.writeText(settingsSummary(conv));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable — nothing to do; settings stay visible on screen.
    }
  };

  const setNum = <K extends keyof ConversionSettings>(key: K, value: number) =>
    setConv((c) => ({ ...c, [key]: value }));

  return (
    <div className="space-y-5">
      <PageHeader title={t('conversionTitle')} subtitle={t('conversionSubtitle')} />

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

      {/* Step 1: audio */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <AudioWaveform className="h-4 w-4 text-iris-400" />
          {t('uploadAudio')}
        </h2>
        {!inputFile ? (
          <AudioUploader accept={ACCEPTED_AUDIO} label={t('chooseAudioFile')} hint={t('uploadHint')} onFiles={handleInputFiles} />
        ) : (
          <div className="space-y-3">
            <WaveformPlayer blob={inputFile} fileName={inputFile.name} />
            <p className="text-xs text-mist-500">
              {formatBytes(inputFile.size)}
              {analyzing ? ` · ${t('analyzing')}` : ''}
            </p>
            <Button variant="ghost" onClick={() => setInputFile(null)}>
              {t('chooseAudioFile')}
            </Button>
          </div>
        )}
      </Card>

      {/* Step 2: model */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Mic2 className="h-4 w-4 text-iris-400" />
          {t('selectModel')}
        </h2>
        {models.length === 0 ? (
          <EmptyState
            title={t('noModelsYet')}
            body={t('importHint')}
            action={<Button onClick={() => navigate('/models')}>{t('importModel')}</Button>}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModelId(m.id)}
                className={`rounded-xl border p-3 text-start transition ${
                  modelId === m.id
                    ? 'border-iris-500/60 bg-iris-500/10'
                    : 'border-white/5 bg-night-800 hover:border-white/15'
                }`}
                aria-pressed={modelId === m.id}
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {modelId === m.id && <Check className="h-4 w-4 text-iris-300" />}
                  {m.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-mist-500" dir="ltr">
                  {m.pthFileName} · {formatBytes(m.pthSize)}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Step 3: settings */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{t('conversionSettings')}</h2>
          <Button variant="ghost" onClick={copySettings} className="min-h-9 px-3 py-1.5 text-xs">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? t('settingsCopied') : t('copySettings')}
          </Button>
        </div>

        <div className="space-y-4">
          <Field label={`${t('jobName')} — ${t('required')}`}>
            <input
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder={t('jobName')}
              className={inputClass}
            />
          </Field>

          <SliderField
            label={t('pitch')}
            hint={t('pitchHint')}
            value={conv.pitch}
            {...CONVERSION_RANGES.pitch}
            onChange={(v) => setNum('pitch', v)}
          />
          <SliderField
            label={t('indexRate')}
            hint={t('indexRateHint')}
            value={conv.indexRate}
            {...CONVERSION_RANGES.indexRate}
            onChange={(v) => setNum('indexRate', v)}
          />
          <SliderField
            label={t('filterRadius')}
            value={conv.filterRadius}
            {...CONVERSION_RANGES.filterRadius}
            onChange={(v) => setNum('filterRadius', v)}
          />
          <SliderField
            label={t('rmsMixRate')}
            value={conv.rmsMixRate}
            {...CONVERSION_RANGES.rmsMixRate}
            onChange={(v) => setNum('rmsMixRate', v)}
          />
          <SliderField
            label={t('protect')}
            value={conv.protect}
            {...CONVERSION_RANGES.protect}
            onChange={(v) => setNum('protect', v)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('f0Method')}>
              <select
                value={conv.f0Method}
                onChange={(e) => setConv((c) => ({ ...c, f0Method: e.target.value as ConversionSettings['f0Method'] }))}
                className={inputClass}
              >
                {F0_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('resampleRate')}>
              <select
                value={conv.resampleRate}
                onChange={(e) => setNum('resampleRate', Number(e.target.value))}
                className={inputClass}
              >
                {RESAMPLE_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r === 0 ? t('resampleOriginal') : `${r} Hz`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('addNote')}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder')}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Button onClick={handleSaveJob} disabled={!canSave} className="w-full">
            {t('prepareJob')}
          </Button>
          {!settings.consentConfirmed && (
            <p className="text-center text-xs leading-relaxed text-amber-300">{t('consentRequired')}</p>
          )}
        </div>
      </Card>

      {/* Jobs */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-mist-300">{t('recentJobs')}</h2>
        {jobs.length === 0 ? (
          <EmptyState title={t('noJobsYet')} />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{job.name}</p>
                    <p className="mt-0.5 text-xs text-mist-500">
                      {job.modelName ?? t('noModelSelected')} ·{' '}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[job.status]}>{t(STATUS_KEY[job.status])}</Badge>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-mist-300">{t('originalAudio')}</p>
                  {job.inputBlob ? (
                    <WaveformPlayer blob={job.inputBlob} fileName={job.inputFileName} compact />
                  ) : (
                    <p className="text-xs text-mist-500" dir="ltr">
                      {job.inputFileName}
                    </p>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-mist-300">{t('convertedAudio')}</p>
                  {job.outputBlob ? (
                    <>
                      <WaveformPlayer blob={job.outputBlob} fileName={job.outputFileName ?? ''} />
                      <Button
                        variant="secondary"
                        onClick={() => downloadBlob(job.outputBlob!, job.outputFileName ?? 'output.wav')}
                      >
                        <Download className="h-4 w-4" />
                        {t('downloadOutput')}
                      </Button>
                    </>
                  ) : (
                    <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs leading-relaxed text-mist-500">
                      {t('noOutputYet')}
                    </p>
                  )}
                </div>

                {job.note && (
                  <p className="mt-3 rounded-xl bg-night-800 px-3 py-2 text-xs leading-relaxed text-mist-300">
                    {job.note}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {colab && job.status === 'waiting-colab' && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(colab.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('openApplio')}
                    </Button>
                  )}
                  {job.status === 'waiting-colab' && (
                    <Button variant="secondary" onClick={() => updateJobStatus(job, 'in-progress')}>
                      {t('markInProgress')}
                    </Button>
                  )}
                  {job.status === 'in-progress' && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setAttachingTo(job.id);
                          outputInputRef.current?.click();
                        }}
                      >
                        {t('attachOutput')}
                      </Button>
                      <Button variant="ghost" onClick={() => updateJobStatus(job, 'failed')}>
                        {t('markFailed')}
                      </Button>
                      <Button variant="ghost" onClick={() => updateJobStatus(job, 'interrupted')}>
                        {t('markInterrupted')}
                      </Button>
                    </>
                  )}
                  {job.status === 'waiting-colab' && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAttachingTo(job.id);
                        outputInputRef.current?.click();
                      }}
                    >
                      {t('attachOutput')}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (window.confirm(t('deleteConfirm'))) {
                        await deleteJob(job.id);
                        await refreshJobs();
                      }
                    }}
                  >
                    {t('deleteJob')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <input
        ref={outputInputRef}
        type="file"
        accept={ACCEPTED_AUDIO}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const job = jobs.find((j) => j.id === attachingTo);
          if (file && job) void handleAttachOutput(job, file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-night-700"
        />
        <span className="w-12 shrink-0 rounded-lg bg-night-800 px-2 py-1 text-center text-xs font-semibold tabular-nums" dir="ltr">
          {value}
        </span>
      </div>
    </Field>
  );
}
