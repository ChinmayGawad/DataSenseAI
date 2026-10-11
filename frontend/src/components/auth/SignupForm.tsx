import React, { useState } from 'react';
import { z } from 'zod';
import { UserPlus, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { registerUser } from '../../lib/api';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
      'Password must include at least one letter, one number, and one special character'
    ),
  confirm_password: z.string().min(1, 'Please confirm your password'),
});

export type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: (token: string, name?: string) => void;
  onGoToLogin?: () => void;
}

export default function SignupForm({ onSuccess, onGoToLogin }: SignupFormProps) {
  const [form, setForm] = useState({ email: '', name: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

    // Confirm password manual check
    if (form.password !== form.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match' });
      return;
    }

    const result = signupSchema.safeParse(form);
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
      const res = await registerUser({
        email: form.email.trim(),
        name: form.name.trim() || 'DataSense User',
        password: form.password,
        confirm_password: form.confirm_password,
      });
      if (res.access_token && onSuccess) {
        onSuccess(res.access_token, res.user?.name || form.name || 'User');
      }
      setMessage('Account created successfully! You are now logged in.');
      setForm({ email: '', name: '', password: '', confirm_password: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-400 font-medium">Join DataSense AI</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-300 transition-all"
            />
          </div>
        </label>

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
              placeholder="At least 8 characters"
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

        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Confirm Password</span>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all ${
                errors.confirm_password ? 'border-red-300 focus:ring-red-200/40 focus:border-red-300' : 'border-slate-200 focus:ring-emerald-400/40 focus:border-emerald-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-xs text-red-500 mt-1 font-medium">{errors.confirm_password}</p>}
        </label>
      </div>

      {message && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2.5 shadow-xs">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
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
            <UserPlus className="w-4 h-4" />
            Sign Up
          </>
        )}
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onGoToLogin}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline transition-colors"
        >
          Already have an account? Log in
        </button>
      </div>
    </form>
  );
}
