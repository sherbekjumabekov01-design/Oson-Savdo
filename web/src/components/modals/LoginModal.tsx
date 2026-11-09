'use client';

import React, { useState } from 'react';
import { Lock, User, Key, CheckCircle, Shield, X, AlertCircle } from 'lucide-react';
import { LoginDto, LoginResponseDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: LoginResponseDto | null;
  onLogin: (dto: LoginDto) => Promise<void>;
  onLogout: () => void;
}

export function LoginModal({ isOpen, onClose, currentUser, onLogin, onLogout }: Props) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin({ username, password });
      setIsSwitching(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login yoki parol xato');
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Tizimga Kirish (Auth)</h2>
              <p className="text-xs text-slate-400">👑 SuperAdmin, Do&apos;kon egasi yoki Kassir</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSwitching(false);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser && !isSwitching ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                {currentUser.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{currentUser.fullName}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    currentUser.role === 'SuperAdmin'
                      ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {currentUser.role === 'SuperAdmin'
                      ? '👑 SaaS Platforma Egasi'
                      : currentUser.role === 'Admin'
                      ? 'Do\'kon Egasi (Admin)'
                      : 'Sotuvchi (Kassir)'}
                  </span>
                  {currentUser.storeName && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      📍 {currentUser.storeName}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">@{currentUser.username}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Ruxsatlar holati:</p>
              {currentUser.role === 'SuperAdmin' ? (
                <p className="text-indigo-600 font-semibold">✓ Barcha do&apos;konlar, obunalar, umumiy statistika va tizim nazorati ochiq.</p>
              ) : currentUser.role === 'Admin' ? (
                <p className="text-emerald-600">✓ Do&apos;konning barcha bo&apos;limlari, xodimlar va foydani ko&apos;rish ochiq.</p>
              ) : (
                <p className="text-amber-600">⚠ Kassir rejimi: Tovar tan narxlari va do&apos;kon foydasi yashiringan.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  fillQuick('superadmin', 'super123');
                  setIsSwitching(true);
                }}
                className="py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                👑 SuperAdmin Kirish
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setIsSwitching(true);
                }}
                className="py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 font-bold text-xs rounded-xl transition"
              >
                Chiqish (Logout)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Foydalanuvchi logini
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="admin, superadmin yoki kassir"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parol
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick pre-fill buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => fillQuick('superadmin', 'super123')}
                className="py-1.5 px-2 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition border border-indigo-200/50"
                title="SaaS Platforma Egasi (SuperAdmin)"
              >
                👑 SuperAdmin
              </button>
              <button
                type="button"
                onClick={() => fillQuick('admin', 'admin123')}
                className="py-1.5 px-2 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition"
              >
                Admin (Do&apos;kon)
              </button>
              <button
                type="button"
                onClick={() => fillQuick('kassir', 'kassir123')}
                className="py-1.5 px-2 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition"
              >
                Kassir (POS)
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Tekshirilmoqda...' : 'Kirish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
