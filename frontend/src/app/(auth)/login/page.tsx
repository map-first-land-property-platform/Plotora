"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail } from "lucide-react";

import AuthShell from "@/features/auth/components/AuthShell";
import TextField from "@/features/auth/components/TextField";
import PasswordInput from "@/features/auth/components/PasswordInput";
import { AppleIcon, GoogleIcon } from "@/features/auth/components/SocialIcons";
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
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const user = await api<AuthUser>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      router.push(
        user.roles.includes("ADMIN")
          ? "/admin/listings"
          : user.roles.includes("SELLER")
            ? "/seller"
            : user.roles.includes("BUYER")
              ? "/buyer/dashboard"
              : "/"
      );
      router.refresh();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Cannot reach the server. Is the backend running?");
    }
  }

  return (
    <AuthShell variant="login">
      <div className="auth-card auth-login-card">
        <div className="login-brand"><Image src="/assets/images/plotora-logo-transparent.png" alt="Plotora" width={235} height={63} priority className="brand-logo-image" /></div>
        <h1>Welcome Back</h1>
        <p className="sub">Sign in to continue your property journey.</p>
        {serverError && <div role="alert" className="alert alert-danger"><div className="a-body">{serverError}</div></div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="form">
          <TextField label="Email address" required type="email" autoComplete="email" placeholder="you@example.com" icon={<Mail className="ic" size={17} />} error={errors.email?.message} {...register("email")} />
          <PasswordInput label="Password" required autoComplete="current-password" placeholder="Your password" icon={<Lock className="ic" size={17} />} error={errors.password?.message} {...register("password")} />
          <div className="login-options">
            <label className="check"><input type="checkbox" {...register("rememberMe")} /><span>Remember me</span></label>
            <Link className="link sm" href="/forgot-password">Forgot password?</Link>
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Login"}</button>
        </form>
        <div className="or">or continue with</div>
        <div className="social-actions">
          <button type="button" className="social-btn" onClick={() => setServerError("Google sign-in is coming soon.")}><GoogleIcon />Google</button>
          <button type="button" className="social-btn" onClick={() => setServerError("Apple sign-in is coming soon.")}><AppleIcon />Apple</button>
        </div>
        <p className="ctr muted mt-5">New to Plotora? <Link className="link" href="/register">Create Account</Link></p>
        <p className="ctr xs muted mt-6">By continuing, you agree to our <Link className="link" href="/terms">Terms</Link> &amp; <Link className="link" href="/privacy">Privacy Policy</Link>.</p>
      </div>
    </AuthShell>
  );
}
