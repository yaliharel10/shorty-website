"use client";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-[#ccc]">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-[#666]">
          {hint}
        </p>
      )}
      <div aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}>
        {children}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClassName =
  "w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#ff7a18] focus:ring-2 focus:ring-[#ff7a18]/20";
