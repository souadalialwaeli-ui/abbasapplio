import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface AudioUploaderProps {
  accept: string;
  multiple?: boolean;
  label: string;
  hint?: string;
  onFiles: (files: File[]) => void;
}

export function AudioUploader({ accept, multiple = false, label, hint, onFiles }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
        dragging ? 'border-iris-400 bg-iris-500/10' : 'border-white/10 bg-night-900 hover:border-iris-500/40'
      }`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-iris-500/10 text-iris-400">
        <UploadCloud className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold">{label}</p>
      {hint && <p className="mt-1 max-w-sm text-xs leading-relaxed text-mist-500">{hint}</p>}
    </div>
  );
}
