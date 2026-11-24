import { Download, Mic2, Trash2 } from 'lucide-react';
import type { VoiceModel } from '../../types';
import { formatBytes } from '../../services/audio/audioAnalysis';
import { useApp } from '../../stores/AppContext';

export function ModelCard({
  model,
  onDelete,
  onExport,
  selected,
  onSelect,
}: {
  model: VoiceModel;
  onDelete: () => void;
  onExport: () => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { t, lang } = useApp();
  const date = new Date(model.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`rounded-2xl border bg-night-900 p-4 transition-colors ${
        selected ? 'border-iris-500/60 bg-iris-500/5' : 'border-white/5'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect();
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-iris-500/30 to-indigo-600/30 text-iris-300">
          <Mic2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{model.name}</p>
          <p className="mt-0.5 truncate text-xs text-mist-500" dir="ltr">
            {model.pthFileName} · {formatBytes(model.pthSize)}
          </p>
          {model.indexFileName && (
            <p className="truncate text-xs text-mist-500" dir="ltr">
              {model.indexFileName} · {formatBytes(model.indexSize ?? 0)}
            </p>
          )}
          <p className="mt-1 text-xs text-mist-600">
            {t('createdAt')}: {date}
          </p>
          {model.notes && <p className="mt-2 text-xs leading-relaxed text-mist-300">{model.notes}</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-mist-100 hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" />
          {t('exportModel')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('delete')}
        </button>
      </div>
    </div>
  );
}
