"use client";
import { useState, useTransition } from "react";
import { login } from "@/app/actions/auth";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-200">
            <svg viewBox="0 0 17 17" fill="none" className="w-5 h-5">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
              <rect x="9" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="2" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl text-gray-900 leading-none">LeaveFlow</h1>
            <p className="text-[9px] font-semibold text-green-600 tracking-widest uppercase mt-0.5">
              Leave Management Platform
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-green-100 shadow-xl shadow-green-100/40 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent" />

          <h2 className="font-display text-xl text-gray-900 mb-1">Welcome back</h2>
          <p className="text-[13px] text-gray-400 mb-7">Sign in to your account to continue</p>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5">
                Email address
              </label>
              <input name="email" type="email" placeholder="your@email.com" required
                autoComplete="email" className="input-base" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <input name="password" type={showPw ? "text" : "password"}
                  placeholder="••••••••" required autoComplete="current-password" className="input-base pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-600">{error}</div>
            )}

            <button type="submit" disabled={isPending}
              className="btn-green w-full justify-center py-2.5 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2"><LogIn size={14} /> Sign in</span>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-[12px] text-gray-400">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-green-600 hover:text-green-700 transition-colors font-medium">
                Signup
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          © {new Date().getFullYear()} LeaveFlow · Paperless leave management
        </p>
      </div>
    </div>
  );
}
