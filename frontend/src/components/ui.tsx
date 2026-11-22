import {
  createElement,
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type TypographyVariant = 'body' | 'muted' | 'caption' | 'label' | 'pageHeading' | 'sectionHeading';
type ColorTone = 'default' | 'muted' | 'subtle' | 'primary' | 'success' | 'warning' | 'danger' | 'inverse';

const typographyVariants: Record<TypographyVariant, string> = {
  body: 'text-sm leading-relaxed',
  muted: 'text-sm leading-relaxed text-slate-600',
  caption: 'text-xs text-slate-500',
  label: 'text-xs font-semibold uppercase tracking-wider text-slate-700',
  pageHeading: 'text-2xl font-bold text-slate-900',
  sectionHeading: 'text-lg font-bold text-slate-900',
};

const colorTones: Record<ColorTone, string> = {
  default: 'text-slate-900',
  muted: 'text-slate-600',
  subtle: 'text-slate-400',
  primary: 'text-indigo-600',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
  inverse: 'text-white',
};

type ParagraphProps = HTMLAttributes<HTMLParagraphElement> & {
  variant?: TypographyVariant;
  tone?: ColorTone;
};

export function Paragraph({ variant, tone, className = '', ...props }: ParagraphProps) {
  const classes = [variant && typographyVariants[variant], tone && colorTones[tone], className]
    .filter(Boolean)
    .join(' ');
  return <p className={classes || undefined} {...props} />;
}

type InlineTextProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: TypographyVariant;
  tone?: ColorTone;
};

export function InlineText({ variant, tone, className = '', ...props }: InlineTextProps) {
  const classes = [variant && typographyVariants[variant], tone && colorTones[tone], className]
    .filter(Boolean)
    .join(' ');
  return <span className={classes || undefined} {...props} />;
}

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: TypographyVariant;
  tone?: ColorTone;
};

export function Heading({ level, variant, tone, className = '', ...props }: HeadingProps) {
  const classes = [variant && typographyVariants[variant], tone && colorTones[tone], className]
    .filter(Boolean)
    .join(' ');
  return createElement(`h${level}`, { className: classes || undefined, ...props });
}

type SurfaceVariant = 'card' | 'authForm' | 'form' | 'subtle' | 'primary' | 'success' | 'warning' | 'danger';
type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'section' | 'article';
  variant?: SurfaceVariant;
};

const surfaceVariants: Record<SurfaceVariant, string> = {
  card: 'surface-card',
  authForm: 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs',
  form: 'rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs',
  subtle: 'rounded-2xl border border-slate-200 bg-slate-50/70',
  primary: 'rounded-2xl border border-indigo-100 bg-indigo-50/70',
  success: 'rounded-2xl border border-emerald-200 bg-emerald-50',
  warning: 'rounded-2xl border border-amber-200 bg-amber-50',
  danger: 'rounded-2xl border border-rose-200 bg-rose-50',
};

export function Surface({ as = 'div', variant = 'card', className = '', ...props }: SurfaceProps) {
  return createElement(as, {
    className: `${surfaceVariants[variant]} ${className}`,
    ...props,
  });
}

type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral' | 'danger';
type BadgeVariant = 'standard' | 'count' | 'status';
type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  variant?: BadgeVariant;
};

const badgeTones: Record<BadgeTone, string> = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  neutral: 'badge-neutral',
  danger: 'inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700',
};

const countBadgeTones: Record<BadgeTone, string> = {
  primary: 'bg-indigo-50 text-indigo-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  neutral: 'bg-slate-100 text-slate-700',
  danger: 'bg-rose-50 text-rose-700',
};

const statusBadgeTones: Record<BadgeTone, string> = {
  primary: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  neutral: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
};

export function Badge({ tone = 'neutral', variant = 'standard', className = '', ...props }: BadgeProps) {
  const classes =
    variant === 'count'
      ? `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${countBadgeTones[tone]}`
      : variant === 'status'
        ? `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${statusBadgeTones[tone]}`
        : badgeTones[tone];

  return <span className={`${classes} ${className}`} {...props} />;
}

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'text'
  | 'tab'
  | 'conversation'
  | 'selectableCard'
  | 'suggestion';

type ButtonSize = 'xs' | 'sm' | 'compact' | 'md' | 'lg' | 'icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  selected?: boolean;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
  danger: 'bg-rose-500 text-white shadow-sm hover:bg-rose-600',
  warning: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  text: 'text-indigo-600 hover:text-indigo-700 hover:underline',
  tab: 'flex-1 justify-center rounded-lg py-2 text-center transition-all duration-150',
  conversation: 'w-full justify-start rounded-2xl p-3 text-left transition-all duration-150',
  selectableCard: 'group flex w-full min-w-0 flex-col justify-between rounded-2xl border bg-white p-5 text-left shadow-xs transition-all duration-200',
  suggestion: 'flex min-h-11 w-full items-start justify-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50',
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: 'justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
  sm: 'justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold',
  compact: 'justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold',
  md: 'justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
  lg: 'justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold',
  icon: 'h-10 w-10 justify-center rounded-xl p-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', selected = false, className = '', ...props },
  ref,
) {
  const usesIntrinsicSpacing = ['tab', 'conversation', 'selectableCard', 'suggestion', 'text'].includes(variant);
  const selectedClass =
    variant === 'tab'
      ? selected
        ? 'bg-white text-indigo-700 shadow-xs font-bold'
        : 'text-slate-500 hover:text-slate-800'
      : variant === 'conversation'
        ? selected
          ? 'border border-indigo-200 bg-indigo-50/80 shadow-sm'
          : 'border border-transparent bg-slate-50/70 hover:bg-slate-100/70'
        : variant === 'selectableCard'
          ? selected
            ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md'
            : 'border-slate-200/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
          : '';

  return (
    <button
      ref={ref}
      className={`inline-flex items-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${usesIntrinsicSpacing ? '' : buttonSizes[size]} ${selectedClass} ${className}`}
      {...props}
    />
  );
});

type ControlVariant = 'default' | 'subtle' | 'readOnly' | 'auth' | 'chat' | 'search' | 'file';

const controlVariants: Record<ControlVariant, string> = {
  default: 'form-input',
  subtle: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none',
  readOnly: 'w-full cursor-default rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none',
  auth: 'h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600',
  chat: 'flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100',
  search: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none',
  file: 'mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-1.5 file:font-semibold file:text-indigo-600 file:shadow-xs hover:file:bg-indigo-50',
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: ControlVariant;
};

export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput(
  { variant = 'default', className = '', ...props },
  ref,
) {
  return <input ref={ref} className={`${controlVariants[variant]} ${className}`} {...props} />;
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: Exclude<ControlVariant, 'auth' | 'chat' | 'search' | 'file'>;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { variant = 'default', className = '', ...props },
  ref,
) {
  return <select ref={ref} className={`${controlVariants[variant]} ${className}`} {...props} />;
});

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: 'default' | 'subtle';
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { variant = 'default', className = '', ...props },
  ref,
) {
  const classes =
    variant === 'subtle'
      ? 'min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none'
      : 'form-input';

  return <textarea ref={ref} className={`${classes} ${className}`} {...props} />;
});

type FormLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  variant?: 'default' | 'auth' | 'inline';
};

export function FormLabel({ variant = 'default', className = '', ...props }: FormLabelProps) {
  const classes =
    variant === 'auth'
      ? 'block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1'
      : variant === 'inline'
        ? 'block text-xs font-bold uppercase tracking-wider text-slate-700'
        : 'mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700';

  return <label className={`${classes} ${className}`} {...props} />;
}
