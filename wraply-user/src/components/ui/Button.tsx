import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement>{
  variant?: "primary" | "outline";
}

function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props){

  const base = `
  px-4
  py-2
  rounded-md
  text-sm
  font-medium
  transition
  focus:outline-none
  focus:ring-2
  focus:ring-ring
  disabled:opacity-50
  disabled:cursor-not-allowed
  active:scale-[0.98]
  `;

  const style = variant === "primary"
    ? `
      bg-primary
      text-primary-foreground
      hover:opacity-90
      `
    : `
      border
      border-border
      hover:bg-muted
      `;

  return(
    <button
      className={`${base} ${style} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button };