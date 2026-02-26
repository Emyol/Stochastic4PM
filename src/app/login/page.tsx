"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A2342] via-[#0B2E59] to-[#0D3B73] px-4 relative overflow-hidden">
      {/* Animated floating decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#1366A6]/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#4DA0E0]/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-48 h-48 bg-[#8CC1F0]/6 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-scale-in border-0 shadow-2xl shadow-black/30 bg-white/95 backdrop-blur-sm">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F4C8A] via-[#1366A6] to-[#4DA0E0] rounded-t-lg" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-4 h-18 w-18 rounded-2xl bg-gradient-to-br from-[#0A2342] to-[#0D3B73] p-3 shadow-xl shadow-[#0A2342]/40 animate-float">
            <img
              src="/logo.png"
              alt="Stochastic4"
              className="h-12 w-12 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#0A2342] to-[#0F4C8A] bg-clip-text text-transparent">
            Stochastic4
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
                className="h-11 transition-all duration-200 focus:shadow-md focus:shadow-[#1366A6]/10 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
                className="h-11 transition-all duration-200 focus:shadow-md focus:shadow-[#1366A6]/10 border-gray-200"
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
              className="w-full h-11 bg-gradient-to-r from-[#0F4C8A] to-[#1366A6] hover:from-[#0D3B73] hover:to-[#0F4C8A] shadow-lg shadow-[#0F4C8A]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#0F4C8A]/30 font-semibold text-sm tracking-wide"
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
        </CardContent>
      </Card>
    </div>
  );
}
