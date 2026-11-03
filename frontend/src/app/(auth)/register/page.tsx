"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Heart, Tag, Wrench } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import TextField from "@/components/auth/TextField";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { GoogleIcon } from "@/components/auth/SocialIcons";
import { api, ApiError } from "@/lib/api";

const schema = z
  .object({
    role: z.enum(["BUYER", "SELLER"]),
    fullName: z.string().trim().min(1, "Full name is required").max(150),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phone: z.string().regex(/^\+?[0-9 ]{9,20}$/, "Enter a valid mobile number, e.g. +94 77 123 4567"),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/,
        "Use 8+ characters with upper case, lower case and a number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((v) => v, "You must accept the Terms and Privacy Policy"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type FormValues = z.infer<typeof schema>;

const ROLES = [
  { value: "BUYER", title: "Buyer / renter", icon: Heart, enabled: true },
  { value: "SELLER", title: "Seller / owner", icon: Tag, enabled: true },
  { value: "AGENT", title: "Agent / broker", icon: Briefcase, enabled: false },
  { value: "SERVICE_PROVIDER", title: "Service provider", icon: Wrench, enabled: false },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "BUYER", fullName: "", email: "", phone: "", password: "", confirmPassword: "", terms: false,
    },
  });

  const role = watch("role");
  const password = watch("password");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          role: values.role,
        }),
      });
      // sign the new user in straight away
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: values.email, password: values.password, rememberMe: false }),
      });
      router.push("/"); // TODO: redirect to the Buyer / Seller dashboard by role
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) {
          setError("email", { message: e.message });
        } else if (Object.keys(e.fieldErrors).length > 0) {
          Object.entries(e.fieldErrors).forEach(([field, message]) =>
            setError(field as keyof FormValues, { message })
          );
        } else {
          setServerError(e.message);
        }
      } else {
        setServerError("Cannot reach the server. Is the backend running?");
      }
    }
  }

  return (
    <AuthShell
      image="/auth/login-landscape.png"
      maxWidth="max-w-[700px]"
      compact
      promoHeading="Join Plotora"
      promoCopy="Create a free account to save properties, send enquiries and list your own land."
    >
      <h1 className="text-[28px] font-bold tracking-tight text-[#0f2a33]">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Free to join. Choose how you&rsquo;ll use Plotora &mdash; you can add more later.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-3">
        {serverError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-[#1f2d33]">I am a...</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const selected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  disabled={!r.enabled}
                  onClick={() => r.enabled && setValue("role", r.value as "BUYER" | "SELLER")}
                  title={r.enabled ? undefined : "Coming soon"}
                  className={`h-[90px] rounded-xl border p-3 text-left transition ${
                    selected ? "border-[#14796a] bg-[#e8f4f1]" : "border-slate-200 bg-white"
                  } ${r.enabled ? "hover:border-[#14796a]" : "cursor-not-allowed"}`}
                >
                  <span
                    className={`mb-2 flex h-7 w-7 items-center justify-center rounded-md ${
                      selected ? "bg-[#14796a] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="block text-sm font-semibold text-[#0f2a33]">{r.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <TextField label="Full name" required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Email" required type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <TextField
            label="Mobile number"
            required
            type="tel"
            autoComplete="tel"
            placeholder="+94 77 123 4567"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <PasswordInput
              label="Password"
              required
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrength password={password} />
          </div>
          <PasswordInput
            label="Confirm password"
            required
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-[#14796a]" {...register("terms")} />
            <span>
              I agree to the <Link href="/terms" className="font-semibold text-[#14796a]">Terms</Link> and{" "}
              <Link href="/privacy" className="font-semibold text-[#14796a]">Privacy Policy</Link>
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-lg bg-[#14796a] text-sm font-semibold text-white transition hover:bg-[#10655a] disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="my-3 flex items-center gap-3 text-xs tracking-widest text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => setServerError("Google sign-up is coming soon.")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        <GoogleIcon /> Sign up with Google
      </button>

      <p className="mt-3 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#14796a] hover:underline">Sign in</Link>
      </p>

    </AuthShell>
  );
}
