import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  AudioWaveform,
  FolderKanban,
  GraduationCap,
  History,
  Home,
  Languages,
  LifeBuoy,
  Mic2,
  PlugZap,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../stores/AppContext';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { to: '/', key: 'navDashboard', icon: Home, end: true },
  { to: '/conversion', key: 'navConversion', icon: AudioWaveform, end: false },
  { to: '/training', key: 'navTraining', icon: GraduationCap, end: false },
  { to: '/models', key: 'navModels', icon: Mic2, end: false },
  { to: '/projects', key: 'navProjects', icon: FolderKanban, end: false },
  { to: '/history', key: 'navHistory', icon: History, end: false },
  { to: '/colab', key: 'navColab', icon: PlugZap, end: false },
  { to: '/settings', key: 'navSettings', icon: Settings, end: false },
  { to: '/help', key: 'navHelp', icon: LifeBuoy, end: false },
] as const;

const MOBILE_NAV = [
  { to: '/', key: 'navDashboard', icon: Home, end: true },
  { to: '/conversion', key: 'navConversion', icon: AudioWaveform, end: false },
  { to: '/training', key: 'navTraining', icon: GraduationCap, end: false },
  { to: '/models', key: 'navModels', icon: Mic2, end: false },
  { to: '/colab', key: 'navColab', icon: PlugZap, end: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLanguage, colab } = useApp();
  const navigate = useNavigate();

  const colabDot =
    colab?.status === 'linked'
      ? 'bg-emerald-400'
      : colab?.status === 'unverified'
        ? 'bg-amber-400'
        : colab?.status === 'expired'
          ? 'bg-red-400'
          : 'bg-mist-500';

  return (
    <div className="min-h-dvh bg-night-950 text-mist-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-white/5 bg-night-900/90 px-4 py-6 backdrop-blur lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-3 px-2">
          <Logo size={40} />
          <div>
            <p className="text-lg font-bold leading-tight tracking-tight">abbasapplio</p>
            <p className="text-xs text-mist-500">{t('appTagline')}</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-iris-500/15 text-iris-300'
                    : 'text-mist-300 hover:bg-white/5 hover:text-mist-100'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {t(item.key)}
              {item.to === '/colab' && (
                <span className={`ms-auto h-2 w-2 rounded-full ${colabDot}`} aria-hidden />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-2xl border border-iris-500/25 bg-iris-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-iris-300">
            <Sparkles className="h-4 w-4" />
            {t('colabStatus')}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-mist-300">
            {colab
              ? t(
                  colab.status === 'linked'
                    ? 'statusLinked'
                    : colab.status === 'unverified'
                      ? 'statusUnverified'
                      : colab.status === 'expired'
                        ? 'statusExpired'
                        : 'statusDisconnected',
                )
              : t('statusDisconnected')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/colab')}
            className="mt-3 w-full rounded-lg bg-iris-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-iris-600"
          >
            {colab ? t('openApplio') : t('connectColab')}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-night-950/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="text-base font-bold tracking-tight">abbasapplio</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/colab')}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-night-800 px-3 py-1.5 text-xs font-medium"
            aria-label={t('colabStatus')}
          >
            <span className={`h-2 w-2 rounded-full ${colabDot}`} />
            {colab ? t('statusLinked') : t('statusDisconnected')}
          </button>
          <button
            type="button"
            onClick={() => setLanguage(lang === 'ar' ? 'en' : 'ar')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-night-800"
            aria-label={lang === 'ar' ? 'English' : 'العربية'}
          >
            <Languages className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:px-6 lg:max-w-5xl lg:pb-12 lg:ps-72 lg:pt-8 xl:max-w-6xl">
        <div className="animate-fade-up">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-night-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-iris-300' : 'text-mist-500 hover:text-mist-100'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {t(item.key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
