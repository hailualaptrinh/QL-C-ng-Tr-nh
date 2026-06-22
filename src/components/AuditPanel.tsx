/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api";
import { 
  ShieldCheck, 
  Download, 
  Users, 
  Trash2, 
  UserPlus, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  History,
  Database,
  Lock,
  X,
  Loader2
} from "lucide-react";
import { UserRole } from "../types";

interface AuditPanelProps {
  user: any;
  onRefresh: () => void;
}

export default function AuditPanel({ user, onRefresh }: AuditPanelProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Users creation fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.PM);

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const usersData = await api.getUsers();
      setUsersList(usersData || []);
      const logsData = await api.getAuditLogs();
      setAuditLogs(logsData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !fullName) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.createUser({ username, password, fullName, role });
      setSuccessMsg("Tài khoản người dùng mới đã được đăng ký thành công!");
      setUsername("");
      setPassword("");
      setFullName("");
      setRole(UserRole.PM);
      fetchSystemData();
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Tạo tài khoản xảy ra lỗi.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === user.id) {
       alert("Bạn không thể tự xóa tài khoản của chính mình!");
       return;
    }
    if (!window.confirm(`Bạn muốn xóa vĩnh viễn tài khoản của "${name}"?`)) {
      return;
    }

    try {
      await api.deleteUser(id);
      alert("Xóa thành công!");
      fetchSystemData();
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Xóa lỗi.");
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const data = await api.triggerBackup();
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `BACKUP_HANH_PHUC_VIET_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      alert("Sao lưu dữ liệu cục bộ thành công!");
    } catch (err) {
      alert("Yêu cầu sao lưu dữ liệu xảy ra sự cố kỹ thuật.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action bar header */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-805 p-4 rounded-2xl border border-slate-150 dark:border-slate-705">
        <div>
          <h2 className="text-sm font-black text-rose-600 dark:text-rose-455 flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5 text-rose-500" /> Bản Quản Trị Bảo Mật Hệ Thống & Kiểm Toán
          </h2>
          <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1">
            Dành riêng cho quản trị cao cấp. Đăng ký nhân viên, giám sát lịch sử sự kiện (Audit Trail)
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          title="Tải nén bản copy toàn bộ dữ liệu hiện thời"
        >
          <Database className="w-4 h-4" />
          <span>Sao lưu dữ liệu (.json)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Users registration and management */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-2">
              <Users className="w-4 h-4 text-rose-500" /> Thành viên đăng nhập hệ thống ({usersList.length})
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-slate-750/30 border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                    <th className="px-3 py-2">Họ & Tên</th>
                    <th className="px-3 py-2">Tên Đăng Nhập</th>
                    <th className="px-3 py-2">Phân Quyền</th>
                    <th className="px-3 py-2 text-right">Lựa chọn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-705">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 text-slate-700 dark:text-slate-300">
                      <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-white capitalize">{u.fullName}</td>
                      <td className="px-3 py-2.5 font-mono">{u.username}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-350 rounded text-[9px] uppercase font-bold tracking-wide">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {u.id !== user.id ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 rounded text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Bạn</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Creation form */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-rose-500" /> Cấp tài khoản hành chính mới
            </h3>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-952 text-red-650 text-xs rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 text-xs rounded-lg flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nguyenvana_pm"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Mật khẩu ban đầu *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Họ & Tên hiển thị *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Chức vụ Hệ Thống *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    {Object.values(UserRole).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Khai báo tài khoản"}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Col: Interactive Audit Trails log */}
        <div className="lg:col-span-1 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-404" /> Lịch sử hoạt động (Audit Logs)
            </h3>

            <div className="space-y-3.5 max-h-[420px] overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-10">Hệ thống chưa ghi nhận biến động mới nào.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-755 rounded-xl border border-slate-100 dark:border-slate-705 text-[11px] leading-relaxed select-all">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-rose-600 dark:text-rose-455 uppercase">{log.userFullName} ({log.role})</span>
                      <span className="text-[9px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString("vi-VN")}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{log.actionDescription}</p>
                    <div className="text-[9px] text-slate-400 mt-1 font-mono text-right">IP: {log.ipAddress || "::1"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
