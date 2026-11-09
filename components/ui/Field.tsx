import React, { useId } from "react";

const INPUT_BASE =
  "block w-full rounded-2xl border bg-cream px-4 text-[15px] text-ink placeholder:text-mute/80 transition-colors outline-none focus:bg-card focus:border-espresso focus:ring-2 focus:ring-espresso/10";

interface FieldProps {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}

/** Label + control + error/hint, wired for screen readers. */
export function Field({ label, optional, error, hint, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-sm font-medium text-ink">
        {label}
        {optional && <span className="text-mute font-normal"> (ไม่บังคับ)</span>}
      </label>
      {children({ id, describedBy: error || hint ? msgId : undefined, invalid: !!error })}
      {error ? (
        <p id={msgId} className="mt-1.5 text-[13px] text-berry-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="mt-1.5 text-[13px] text-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextInput({ invalid, className = "", ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${INPUT_BASE} h-12 ${invalid ? "border-berry" : "border-line-2"} ${className}`}
      {...rest}
    />
  );
});

export function TextArea({
  invalid,
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`${INPUT_BASE} py-3 resize-none ${invalid ? "border-berry" : "border-line-2"} ${className}`}
      {...rest}
    />
  );
}
