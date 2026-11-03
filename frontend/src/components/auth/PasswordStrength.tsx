export function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-[#14796a]"];

export default function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  return (
    <div className="mt-2 flex gap-1.5" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${i < score ? COLORS[score - 1] : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}