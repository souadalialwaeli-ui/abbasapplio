import { useRef, useState } from 'react';
import { Mic2, Upload } from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Button, Field, Notice, PageHeader, inputClass } from '../../components/common/ui';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ModelCard } from '../../components/models/ModelCard';
import { ACCEPTED_INDEX, ACCEPTED_MODEL } from '../../services/audio/audioAnalysis';
import { deleteModel, generateId, saveModel } from '../../services/db';
import type { VoiceModel } from '../../types';

export function ModelsPage() {
  const { t, models, refreshModels } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [pthFile, setPthFile] = useState<File | null>(null);
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pthRef = useRef<HTMLInputElement>(null);
  const indexRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setNotes('');
    setPthFile(null);
    setIndexFile(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!name.trim() || !pthFile) {
      setError(t('modelNameRequired'));
      return;
    }
    const model: VoiceModel = {
      id: generateId(),
      name: name.trim(),
      pthFileName: pthFile.name,
      pthSize: pthFile.size,
      pthBlob: pthFile,
      indexFileName: indexFile?.name,
      indexSize: indexFile?.size,
      indexBlob: indexFile ?? undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    await saveModel(model);
    await refreshModels();
    resetForm();
    setModalOpen(false);
    setNotice(t('modelImported'));
  };

  const handleExport = (model: VoiceModel) => {
    if (model.pthBlob) {
      const url = URL.createObjectURL(model.pthBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = model.pthFileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
    if (model.indexBlob && model.indexFileName) {
      const url = URL.createObjectURL(model.indexBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = model.indexFileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('modelsTitle')}
        subtitle={t('modelsSubtitle')}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Upload className="h-4 w-4" />
            {t('importModel')}
          </Button>
        }
      />

      <Notice tone="info">{t('authorizedUseOnly')}</Notice>
      {notice && (
        <Notice tone="success">
          {notice}
          <button type="button" className="ms-2 font-semibold underline" onClick={() => setNotice(null)}>
            {t('close')}
          </button>
        </Notice>
      )}

      {models.length === 0 ? (
        <EmptyState
          icon={<Mic2 className="h-6 w-6" />}
          title={t('noModelsYet')}
          body={t('importHint')}
          action={<Button onClick={() => setModalOpen(true)}>{t('importModel')}</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {models.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              onExport={() => handleExport(m)}
              onDelete={async () => {
                if (window.confirm(t('deleteConfirm'))) {
                  await deleteModel(m.id);
                  await refreshModels();
                }
              }}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('importModel')}>
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-mist-500">{t('importHint')}</p>
          <Field label={`${t('modelName')} — ${t('required')}`}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder={t('modelName')} />
          </Field>

          <Field label={`${t('importPth')} — ${t('required')}`}>
            <button
              type="button"
              onClick={() => pthRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-white/15 bg-night-800 px-3.5 py-3 text-start text-sm text-mist-300 hover:border-iris-500/50"
              dir="ltr"
            >
              {pthFile ? pthFile.name : t('importPth')}
            </button>
            <input
              ref={pthRef}
              type="file"
              accept={ACCEPTED_MODEL}
              className="hidden"
              onChange={(e) => setPthFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          <Field label={t('importIndex')}>
            <button
              type="button"
              onClick={() => indexRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-white/15 bg-night-800 px-3.5 py-3 text-start text-sm text-mist-300 hover:border-iris-500/50"
              dir="ltr"
            >
              {indexFile ? indexFile.name : t('importIndex')}
            </button>
            <input
              ref={indexRef}
              type="file"
              accept={ACCEPTED_INDEX}
              className="hidden"
              onChange={(e) => setIndexFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          <Field label={t('modelNotes')}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t('modelNotesPlaceholder')}
              className={`${inputClass} resize-none`}
            />
          </Field>

          {error && <p className="text-xs text-red-300">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleImport} className="flex-1">
              {t('importModel')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                resetForm();
                setModalOpen(false);
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
