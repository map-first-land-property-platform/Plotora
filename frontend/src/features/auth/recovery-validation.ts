import { z } from "zod";

export const recoveryEmailSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

// Match the current registration policy; the backend must enforce it as well.
export const recoveryPasswordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "An uppercase and a lowercase letter", test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: "At least one number", test: (value: string) => /\d/.test(value) },
  { label: "No more than 100 characters", test: (value: string) => value.length <= 100 },
  { label: "Fits within 72 UTF-8 bytes", test: (value: string) => new TextEncoder().encode(value).length <= 72 },
];

export const recoveryPasswordSchema = z.object({
  password: z.string().min(1, "Enter a new password").refine(
    (value) => recoveryPasswordRules.every((rule) => rule.test(value)),
    "Use at least 8 characters with uppercase, lowercase and a number, within 72 UTF-8 bytes",
  ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords do not match",
});
