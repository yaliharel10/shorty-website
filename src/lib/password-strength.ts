type Strength = "weak" | "fair" | "good" | "strong";

export function scorePassword(password: string): {
  score: Strength;
  percent: number;
  tips: string[];
} {
  let points = 0;
  const tips: string[] = [];

  if (password.length >= 8) points += 25;
  else tips.push("Use at least 8 characters");

  if (password.length >= 12) points += 15;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 20;
  else tips.push("Mix upper and lower case");

  if (/[0-9]/.test(password)) points += 20;
  else tips.push("Add a number");

  if (/[^A-Za-z0-9]/.test(password)) points += 20;
  else tips.push("Add a symbol");

  const percent = Math.min(100, points);
  let score: Strength = "weak";
  if (percent >= 80) score = "strong";
  else if (percent >= 60) score = "good";
  else if (percent >= 40) score = "fair";

  return { score, percent, tips };
}

export const strengthColors: Record<Strength, string> = {
  weak: "bg-red-500",
  fair: "bg-orange-500",
  good: "bg-yellow-500",
  strong: "bg-emerald-500",
};
