"use client";
import { clsx } from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "gold" | "ghost" | "approve" | "reject" | "view";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; loading?: boolean; fullWidth?: boolean;
}
const variantClass: Record<Variant, string> = {
  gold: "btn-green", ghost: "btn-ghost",
  approve: "btn-approve", reject: "btn-reject", view: "btn-view",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", loading, fullWidth, className, children, disabled, ...props }, ref) => (
    <button ref={ref} disabled={disabled || loading}
      className={clsx(variantClass[variant], fullWidth && "w-full justify-center",
        (disabled || loading) && "opacity-50 cursor-not-allowed", className)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
);
Button.displayName = "Button";
