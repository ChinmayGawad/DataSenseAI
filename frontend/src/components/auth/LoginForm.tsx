import React, { useState } from 'react';
import { z } from 'zod';
import { LogIn, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { loginUser } from '../../lib/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: (token: string, name?: string) => void;
  onGoToSignup?: () => void;
}

export default function LoginForm({ onSuccess, onGoToSignup }: LoginFormProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (key) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (res.access_token && onSuccess) {
        onSuccess(res.access_token, res.user?.name || 'User');
      }
      setMessage('Login successful! Welcome back.');
      setForm({ email: '', password: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
          <LogIn className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 font-medium">Log in to DataSense AI</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all ${
                errors.email ? 'border-red-300 focus:ring-red-200/40 focus:border-red-300' : 'border-slate-200 focus:ring-emerald-400/40 focus:border-emerald-300'
              }`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Password</span>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all ${
                errors.password ? 'border-red-300 focus:ring-red-200/40 focus:border-red-300' : 'border-slate-200 focus:ring-emerald-400/40 focus:border-emerald-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>}
        </label>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border flex items-center gap-2.5 shadow-xs ${
          message.includes('successful') || message.includes('Welcome') ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          <Check className={`w-4 h-4 shrink-0 ${message.includes('successful') ? 'text-emerald-500' : 'text-red-500'}`} />
          <span>{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-sm font-bold tracking-wide shadow-lg shadow-[#0c1815]/15 hover:shadow-xl hover:shadow-[#0c1815]/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Log In
          </>
        )}
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onGoToSignup}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline transition-colors"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </form>
  );
}
