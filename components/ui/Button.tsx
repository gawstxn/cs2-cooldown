import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-espresso text-on-dark hover:bg-espresso-2",
  secondary: "bg-card text-ink border border-line-2 hover:border-ink-2",
  ghost: "bg-transparent text-ink hover:bg-soft",
  danger: "bg-berry text-on-dark hover:bg-berry-ink",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-[15px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  icon,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-ring ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  bordered?: boolean;
}

export function IconButton({
  label,
  bordered,
  className = "",
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-grid place-items-center size-10 shrink-0 rounded-full text-ink-2 hover:text-ink hover:bg-soft transition-colors cursor-pointer focus-ring ${bordered ? "border border-line-2 bg-card" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
