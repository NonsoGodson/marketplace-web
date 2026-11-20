import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          className={`rounded border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 ${
            error ? 'border-clay' : 'border-line focus:border-indigo'
          } ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-sm text-clay">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
