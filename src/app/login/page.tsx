"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branded hero */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#021024] via-[#052659] to-[#021024]">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern opacity-[0.06]" />

        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#5483B3]/15 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-32 right-20 w-96 h-96 bg-[#7DA0CA]/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#C1E8FF]/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        />

        {/* Grid lines */}
        <div className="absolute inset-0 grid-pattern opacity-40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <img
                src="/logo.png"
                alt="Stochastic4"
                className="h-6 w-6 object-contain"
              />
            </div>
            <span className="font-semibold text-lg text-white/90">
              Stochastic4
            </span>
          </div>

          {/* Hero text */}
          <div className="max-w-lg space-y-6">
            <div className="space-y-2">
              <p
                className="text-sm font-medium uppercase tracking-[0.2em] text-[#7DA0CA] animate-slide-up opacity-0"
                style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
              >
                Project Management
              </p>
              <h1
                className="text-5xl font-bold leading-[1.1] tracking-tight animate-slide-up opacity-0"
                style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
              >
                <span className="bg-gradient-to-r from-white via-[#C1E8FF] to-[#7DA0CA] bg-clip-text text-transparent">
                  Plan. Build.
                </span>
                <br />
                <span className="text-white">Ship.</span>
              </h1>
            </div>
            <p
              className="text-base text-[#7DA0CA]/80 leading-relaxed max-w-md animate-slide-up opacity-0"
              style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
            >
              Manage sprints, track tasks, and collaborate with your team — all
              in one place.
            </p>

            {/* Feature pills */}
            <div
              className="flex flex-wrap gap-2 animate-slide-up opacity-0"
              style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
            >
              {["Kanban Board", "Gantt Charts", "Sprint Planning", "Calendar"].map(
                (feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 text-xs font-medium rounded-full border border-[#5483B3]/30 text-[#7DA0CA] bg-[#5483B3]/5"
                  >
                    {feature}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-xs text-[#5483B3]/50 animate-fade-in">
            © 2026 Stochastic4. Built for teams.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-white px-6 relative">
        {/* Subtle grid */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#021024] to-[#052659] shadow-lg">
              <img
                src="/logo.png"
                alt="Stochastic4"
                className="h-7 w-7 object-contain"
              />
            </div>
            <span className="font-bold text-xl text-[#021024]">
              Stochastic4
            </span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-[#021024] tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-[#64748b]">
              Sign in to continue to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-[#64748b]"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@stochastic4.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200 bg-white transition-all duration-200 focus:shadow-lg focus:shadow-[#5483B3]/10 focus:border-[#5483B3]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-[#64748b]"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200 bg-white transition-all duration-200 focus:shadow-lg focus:shadow-[#5483B3]/10 focus:border-[#5483B3]"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                <span className="text-sm text-red-600 font-medium">
                  {error}
                </span>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#052659] to-[#5483B3] hover:from-[#021024] hover:to-[#052659] shadow-lg shadow-[#052659]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#052659]/30 font-semibold text-sm tracking-wide"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-[#64748b]/60">
            Powered by Stochastic4
          </p>
        </div>
      </div>
    </div>
  );
}
