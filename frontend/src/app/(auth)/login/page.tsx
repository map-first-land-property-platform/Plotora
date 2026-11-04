"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import TextField from "@/components/auth/TextField";
import PasswordInput from "@/components/auth/PasswordInput";
import { AppleIcon, GoogleIcon } from "@/components/auth/SocialIcons";
import { api, ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface AuthUser {
  roles: string[];
}

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const user = await api<AuthUser>("/api/auth/login", { method: "POST", body: JSON.stringify(values) });
      router.push(
        user.roles.includes("ADMIN") ? "/admin/listings"
          : user.roles.includes("SELLER") ? "/seller"
          : user.roles.includes("BUYER") ? "/buyer/dashboard"
          : "/",
      );
      router.refresh();
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : "Cannot reach the server. Is the backend running?"
      );
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[28px] font-bold tracking-tight text-[#0f2a33]">Welcome Back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to continue your property journey.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <TextField
          label="Email address"
          required
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail size={18} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Your password"
          icon={<Lock size={18} />}
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-[#14796a]" {...register("rememberMe")} />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-semibold text-[#14796a] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-lg bg-[#14796a] text-sm font-semibold text-white transition hover:bg-[#10655a] disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs tracking-widest text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR CONTINUE WITH
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setServerError("Google sign-in is coming soon.")}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <GoogleIcon /> Google
        </button>
        <button
          type="button"
          onClick={() => setServerError("Apple sign-in is coming soon.")}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <AppleIcon /> Apple
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to Plotora?{" "}
        <Link href="/register" className="font-semibold text-[#14796a] hover:underline">
          Create Account
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-slate-500">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="font-semibold text-[#14796a]">Terms</Link> &amp;{" "}
        <Link href="/privacy" className="font-semibold text-[#14796a]">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}
