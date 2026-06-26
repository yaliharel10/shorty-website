"use client";

import { strengthColors, scorePassword } from "@/lib/password-strength";

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { score, percent, tips } = scorePassword(password);

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="h-1.5 overflow-hidden rounded-full bg-[#222]">
        <div
          className={`h-full transition-all duration-300 ${strengthColors[score]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs capitalize text-[#888]">
        Password strength: <span className="text-[#ccc]">{score}</span>
      </p>
      {tips.length > 0 && (
        <ul className="text-xs text-[#666]">
          {tips.slice(0, 2).map((tip) => (
            <li key={tip}>· {tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
