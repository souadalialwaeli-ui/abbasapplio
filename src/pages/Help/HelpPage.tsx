import { useState } from 'react';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Card, PageHeader } from '../../components/common/ui';

const FAQ = [
  { q: 'faqColabQ', a: 'faqColabA' },
  { q: 'faqPrivacyQ', a: 'faqPrivacyA' },
  { q: 'faqFormatQ', a: 'faqFormatA' },
  { q: 'faqModelQ', a: 'faqModelA' },
  { q: 'faqOfflineQ', a: 'faqOfflineA' },
  { q: 'faqGradioQ', a: 'faqGradioA' },
] as const;

export function HelpPage() {
  const { t } = useApp();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-5">
      <PageHeader title={t('helpTitle')} subtitle={t('helpSubtitle')} />

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-iris-500/10 text-iris-400">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-mist-300">{t('helpSubtitle')}</p>
        </div>
      </Card>

      <div className="space-y-2">
        {FAQ.map((item, i) => (
          <div key={item.q} className="overflow-hidden rounded-2xl border border-white/5 bg-night-900">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start text-sm font-semibold"
              aria-expanded={open === i}
            >
              {t(item.q)}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-mist-500 transition-transform ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <p className="border-t border-white/5 px-4 py-3 text-xs leading-relaxed text-mist-300">
                {t(item.a)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
