/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { api } from "../api";
import { KeyRound, ShieldAlert, CheckCircle, Smartphone, User, Lock, Loader2 } from "lucide-react";
import { UserRole } from "../types";

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Vui lòng điền tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.login({ username, password });
      setSuccessMsg(`Xin chào ${data.user.fullName}! Đăng nhập thành công.`);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Đăng nhập thất bại. Kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        
        {/* Brand Header with HTML SVG roof matching requested logo */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-850 border-b border-rose-100 dark:border-rose-950/20">
          <div className="flex justify-center mb-4">
            {/* Custom SVG logo representing Hanh Phuc Viet with beautiful vector design */}
            <svg viewBox="0 0 450 180" className="w-48 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Green Left Roof */}
              <path d="M40 90 L110 55 L160 80" stroke="#10B981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              {/* Red Main Roof */}
              <path d="M100 80 L230 15 L360 80" stroke="#EF4444" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              {/* Green Right Roof */}
              <path d="M300 80 L350 55 L420 90" stroke="#10B981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* House Window under Red Roof */}
              <rect x="215" y="55" width="30" height="30" rx="4" fill="white" stroke="#EF4444" strokeWidth="4" />
              <line x1="230" y1="55" x2="230" y2="85" stroke="#EF4444" strokeWidth="2" />
              <line x1="215" y1="70" x2="245" y2="70" stroke="#EF4444" strokeWidth="2" />
              
              {/* Logo Curved underline ornaments */}
              <path d="M40 145 C 100 145, 140 148, 180 145" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
              <path d="M280 145 C 320 145, 360 148, 420 145" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />

              {/* Text */}
              <text x="50%" y="115" textAnchor="middle" fill="#EF4444" fontSize="32" fontWeight="bold" fontFamily="Inter, sans-serif">Hanh Phuc Viet</text>
              <text x="50%" y="140" textAnchor="middle" fill="#EF4444" fontSize="18" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="1.5">Construction</text>
              <text x="50%" y="165" textAnchor="middle" fill="#10B981" fontSize="16" fontWeight="bold" fontFamily="monospace">0988.03.04.07</text>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">HỆ THỐNG QUẢN LÝ CÔNG TRÌNH</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đăng nhập tài khoản của bạn để tiếp tục</p>
        </div>

        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-950/40 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-950/40 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Tài khoản đăng nhập
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder="admin, giamdoc, pm, ketoan..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-medium rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Trích xuất hồ sơ...
                </>
              ) : (
                <>Đăng Nhập Hệ Thống</>
              )}
            </button>
          </form>

          {/* Quick links to roles - incredibly helpful */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-6">
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <KeyRound className="w-4 h-4 text-emerald-500" /> Đăng nhập nhanh để trải nghiệm phân quyền
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin("admin", "admin123")}
                className="p-2 text-left rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30 transition-all font-medium"
              >
                🛠️ Admin (admin123)
              </button>
              <button
                type="button"
                onClick={() => quickLogin("giamdoc", "giamdoc123")}
                className="p-2 text-left rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30 transition-all font-medium"
              >
                📊 Giám Đốc (giamdoc123)
              </button>
              <button
                type="button"
                onClick={() => quickLogin("pm", "pm123")}
                className="p-2 text-left rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-800 dark:text-blue-400 border border-blue-100 dark:border-blue-950/30 transition-all font-medium"
              >
                🏗️ Quản Lý Dự Án (pm123)
              </button>
              <button
                type="button"
                onClick={() => quickLogin("ketoan", "ketoan123")}
                className="p-2 text-left rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-950/30 transition-all font-medium"
              >
                💰 Kế Toán (ketoan123)
              </button>
              <button
                type="button"
                onClick={() => quickLogin("kho", "kho123")}
                className="p-2 text-left rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-800 dark:text-purple-400 border border-purple-100 dark:border-purple-950/30 transition-all font-medium"
              >
                📦 Kho (kho123)
              </button>
              <button
                type="button"
                onClick={() => quickLogin("kythuat", "kythuat123")}
                className="p-2 text-left rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/30 transition-all font-medium"
              >
                ✏️ Kỹ Thuật (kythuat123)
              </button>
            </div>
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => quickLogin("nhancong", "nhancong123")}
                className="w-full p-2 text-left rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-all font-medium text-xs"
              >
                👷 Nhân Công (nhancong123)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
