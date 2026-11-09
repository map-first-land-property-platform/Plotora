"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Heart, Tag, Wrench } from "lucide-react";

import AuthShell from "@/features/auth/components/AuthShell";
import TextField from "@/features/auth/components/TextField";
import PasswordInput from "@/features/auth/components/PasswordInput";
import PasswordStrength from "@/features/auth/components/PasswordStrength";
import { GoogleIcon } from "@/features/auth/components/SocialIcons";
import { api, ApiError } from "@/lib/api";

const schema = z.object({
  role: z.enum(["BUYER", "SELLER"]),
  fullName: z.string().trim().min(1, "Full name is required").max(150),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().regex(/^\+?[0-9 ]{9,20}$/, "Enter a valid mobile number, e.g. +94 77 123 4567"),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,100}$/, "Use 8+ characters with upper case, lower case and a number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  terms: z.boolean().refine((v) => v, "You must accept the Terms and Privacy Policy"),
}).refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
type FormValues = z.infer<typeof schema>;

interface AuthUser {
  roles: string[];
}

const ROLES = [
  { value: "BUYER", title: "Buyer / renter", icon: Heart, enabled: true },
  { value: "SELLER", title: "Seller / owner", icon: Tag, enabled: true },
  { value: "AGENT", title: "Agent / broker", icon: Briefcase, enabled: false },
  { value: "SERVICE_PROVIDER", title: "Service provider", icon: Wrench, enabled: false },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "BUYER", fullName: "", email: "", phone: "", password: "", confirmPassword: "", terms: false },
  });
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

      const user = await api<{ roles: string[] }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          rememberMe: false,
        }),
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
      if (e instanceof ApiError) {
        if (e.status === 409) setError("email", { message: e.message });
        else if (Object.keys(e.fieldErrors).length) Object.entries(e.fieldErrors).forEach(([field, message]) => setError(field as keyof FormValues, { message }));
        else setServerError(e.message);
      } else setServerError("Cannot reach the server. Is the backend running?");
    }
  }

  return (
    <AuthShell variant="register" image="/auth/login-landscape.png" promoHeading="Join Plotora" promoCopy="Create a free account to save properties, send enquiries and list your own land.">
      <div className="auth-card auth-register-card">
        <div className="login-brand"><Image src="/assets/images/plotora-logo-transparent.png" alt="Plotora" width={290} height={78} priority className="brand-logo-image" /></div>
        <h1>Create your account</h1>
        <p className="sub">Free to join. Choose how you’ll use Plotora — you can add more later.</p>
        {serverError && <div role="alert" className="alert alert-danger"><div className="a-body">{serverError}</div></div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="form">
          <div className={`field ${errors.role ? "is-invalid" : ""}`}>
            <label className="label">I am a...</label>
            <div className="radio-cards">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <label className="radio-card" key={r.value} title={r.enabled ? undefined : "Coming soon"}>
                    <input type="radio" value={r.value} disabled={!r.enabled} {...register("role")} />
                    <span className="rc"><span className="ic-wrap"><Icon size={18} /></span><strong>{r.title}</strong></span>
                  </label>
                );
              })}
            </div>
            {errors.role && <div className="field-error" role="alert">{errors.role.message}</div>}
          </div>
          <div className="form-grid registration-fields">
            <div className="wide">
              <TextField label="Full name" required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
            </div>
            <TextField label="Email" required type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <TextField label="Mobile number" required type="tel" autoComplete="tel" placeholder="+94 77 123 4567" error={errors.phone?.message} {...register("phone")} />
            <div>
              <PasswordInput label="Password" required autoComplete="new-password" error={errors.password?.message} {...register("password")} />
              <PasswordStrength password={password} />
            </div>
            <PasswordInput label="Confirm password" required autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          </div>
          <div className={`field ${errors.terms ? "is-invalid" : ""}`}>
            <label className="check"><input type="checkbox" {...register("terms")} /><span>I agree to the <Link className="link" href="/terms">Terms</Link> and <Link className="link" href="/privacy">Privacy Policy</Link></span></label>
            {errors.terms && <div className="field-error" role="alert">{errors.terms.message}</div>}
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</button>
        </form>
        <div className="or">or</div>
        <button type="button" className="social-btn w-full" onClick={() => setServerError("Google sign-up is coming soon.")}><GoogleIcon />Sign up with Google</button>
        <p className="ctr muted mt-3">Already have an account? <Link className="link" href="/login">Sign in</Link></p>
      </div>
    </AuthShell>
  );
}
