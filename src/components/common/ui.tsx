import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-l from-iris-500 to-indigo-600 text-white shadow-lg shadow-iris-500/25 hover:from-iris-600 hover:to-indigo-700 disabled:from-night-700 disabled:to-night-700 disabled:shadow-none',
  secondary: 'bg-night-700 text-mist-100 hover:bg-night-600 disabled:opacity-50',
  ghost: 'bg-transparent text-mist-300 hover:bg-white/5 hover:text-mist-100 disabled:opacity-50',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-50',
  outline:
    'border border-iris-500/40 bg-iris-500/10 text-iris-300 hover:bg-iris-500/20 disabled:opacity-50',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-night-900 p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-sm leading-relaxed text-mist-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'violet';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-white/5 text-mist-300',
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-300',
    danger: 'bg-red-500/15 text-red-300',
    info: 'bg-sky-500/15 text-sky-300',
    violet: 'bg-iris-500/15 text-iris-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: 'border-sky-500/25 bg-sky-500/10 text-sky-200',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
    danger: 'border-red-500/25 bg-red-500/10 text-red-200',
  };
  return (
    <div className={`rounded-2xl border p-4 text-sm leading-relaxed ${tones[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-mist-100">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs leading-relaxed text-mist-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-white/10 bg-night-800 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-600 focus:border-iris-500/60 focus:outline-none';
