export const OTP_LENGTH = 6;

export function emptyOtp(): string[] {
  return Array<string>(OTP_LENGTH).fill("");
}

/** Preserve empty positions when editing a middle digit; never shift later digits. */
export function writeOtp(digits: readonly string[], index: number, raw: string): string[] {
  const next = emptyOtp().map((_, i) => /^[0-9]$/.test(digits[i] ?? "") ? digits[i] : "");
  if (!Number.isInteger(index) || index < 0 || index >= OTP_LENGTH) return next;
  const clean = raw.replace(/[^0-9]/g, "");
  if (!clean) next[index] = "";
  else clean.slice(0, OTP_LENGTH - index).split("").forEach((digit, offset) => { next[index + offset] = digit; });
  return next;
}

export function isCompleteOtp(digits: readonly string[]): boolean {
  return digits.length === OTP_LENGTH && digits.every((digit) => /^[0-9]$/.test(digit));
}
