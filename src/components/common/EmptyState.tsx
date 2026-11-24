import type { ReactNode } from 'react';
import { FileAudio } from 'lucide-react';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-night-900/60 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-iris-500/10 text-iris-400">
        {icon ?? <FileAudio className="h-6 w-6" />}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-xs leading-relaxed text-mist-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
