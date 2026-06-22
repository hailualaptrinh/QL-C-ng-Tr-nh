/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { DailyDiary, ConstructionProject, UserRole } from "../types";
import { api } from "../api";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Users, 
  Clipboard, 
  Paperclip, 
  ImageIcon, 
  Video, 
  AlertCircle,
  X,
  Loader2
} from "lucide-react";

interface DiaryProps {
  diaries: DailyDiary[];
  projects: ConstructionProject[];
  user: any;
  onRefresh: () => void;
}

export default function Diary({ diaries, projects, user, onRefresh }: DiaryProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  
  // New diary form fields
  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasksDone, setTasksDone] = useState("");
  const [workersCount, setWorkersCount] = useState<number>(8);
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authorization check (Admin, PM, and Engineers can update)
  const isAuthorizedToLog = [UserRole.ADMIN, UserRole.PM, UserRole.KY_THUAT].includes(user.role as UserRole);
  const isAuthorizedToDelete = [UserRole.ADMIN, UserRole.PM].includes(user.role as UserRole);

  // Sync default projectId on open to avoid empty database selections
  const openLogModal = () => {
    setProjectId(projects[0]?.id || "");
    setDate(new Date().toISOString().split('T')[0]);
    setTasksDone("");
    setWorkersCount(8);
    setNotes("");
    setImageUrl("");
    setErrorMsg(null);
    setModalOpen(true);
  };

  // Filter diaries by selected project
  const filteredDiaries = useMemo(() => {
    if (selectedProjectId === "ALL") return diaries;
    return diaries.filter(d => d.projectId === selectedProjectId);
  }, [diaries, selectedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !date || !tasksDone || workersCount === undefined) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);

    // Dynamic photo placeholders if empty
    const mediaToUpload = [];
    if (imageUrl) {
      mediaToUpload.push({ id: `med-${Date.now()}`, type: 'image' as const, url: imageUrl });
    } else {
      // Auto-populate professional construction site vector layout placeholder
      mediaToUpload.push({
        id: `med-${Date.now()}`,
        type: 'image' as const,
        url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80"
      });
    }

    try {
      await api.createDiary({
        projectId,
        date,
        tasksDone,
        workersCount: Number(workersCount),
        notes,
        media: mediaToUpload
      });
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Xảy ra lỗi trong khi ghi nhật ký.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, logDate: string) => {
    if (!window.confirm(`Bạn muốn xóa nhật ký công trình ngày ${logDate}?`)) {
      return;
    }

    try {
      await api.deleteDiary(id);
      alert("Xóa thành công!");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa nhật ký.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action view */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" /> NHẬT KÝ THI CÔNG HẰNG NGÀY
          </h2>
          <p className="text-xs text-slate-505 dark:text-slate-400 mt-1">Cập nhật hình ảnh lắp ghép vách, tiến độ thực tế, thời tiết hiện trường hằng ngày</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtering trigger dropdown */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm focus:outline-none"
          >
            <option value="ALL">Tất cả dự án</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>

          {isAuthorizedToLog && (
            <button
              onClick={openLogModal}
              className="px-4 py-2 bg-rose-650 hover:bg-rose-700 bg-rose-650 bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Viết Nhật Ký</span>
            </button>
          )}
        </div>
      </div>

      {/* Diary Card Log layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDiaries.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 text-slate-405 text-sm">
            Chưa có ghi chép nhật ký hiện trường cho dự án này.
          </div>
        ) : (
          filteredDiaries.map((log) => (
            <div key={log.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-705 shadow-sm overflow-hidden flex flex-col justify-between">
              
              {/* Card visual body */}
              <div className="p-5 space-y-4">
                
                {/* Visual date & Author block */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-705/30 p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-4 h-4 text-rose-500 shrink-0" /> {log.date}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Ghi bởi: {log.updatedBy}
                  </span>
                </div>

                {/* Construction detail */}
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dự án liên đới</span>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-405 mt-0.5">{log.projectName}</p>
                </div>

                {/* Worker counts / Tasks done */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Công việc hoàn thành
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-normal font-semibold">
                      {log.tasksDone}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-750/35 rounded-xl text-center self-start">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Nhân công</span>
                    <span className="text-lg font-mono font-black text-rose-500 dark:text-rose-450 mt-0.5 block flex items-center justify-center gap-1">
                      <Users className="w-4 h-4 text-rose-500 shrink-0" /> {log.workersCount} thợ
                    </span>
                  </div>
                </div>

                {/* Optional additional notes */}
                {log.notes && (
                  <div className="p-2.5 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-105 dark:border-yellow-950/20 text-xs italic text-slate-600 dark:text-slate-350 rounded-xl leading-normal">
                    💡 <b>Chú thích hiện trường</b>: {log.notes}
                  </div>
                )}

                {/* Media Image display */}
                {log.media && log.media.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-505" /> Hình ảnh hiện vật tại công trình
                    </span>
                    <div className="grid grid-cols-1 gap-2 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm relative group">
                      <img 
                        src={log.media[0].url} 
                        alt="Hiện trường" 
                        referrerPolicy="no-referrer"
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-305"
                      />
                      {/* Interactive overlay tag representation */}
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-filter backdrop-blur-sm shadow hover:bg-slate-900 text-white rounded px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold">
                        Ảnh góc chụp vách lắp ghép
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Delete */}
              {isAuthorizedToDelete && (
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-750/30 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <button
                    onClick={() => handleDelete(log.id, log.date)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 capitalize"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xóa nhật ký ngày thi công
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Diary Entry Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Ghi chép nhật ký công trình mới
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-605">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Liên kết công trình *</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Ngày cập nhật *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Nhân công thực tế có mặt *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={workersCount}
                      onChange={(e) => setWorkersCount(Number(e.target.value))}
                      placeholder="10 thợ"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Chi tiết công tác kĩ thuật hoàn thành *</label>
                  <textarea
                    rows={3}
                    required
                    value={tasksDone}
                    onChange={(e) => setTasksDone(e.target.value)}
                    placeholder="Lắp hoàn thiện 14 vách Panel cách nhiệt EPS mặt tiền, sơn nước lót lớp chống kỉ đà sắt hộp chính..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Ghi chú bổ trợ (Ví dụ: Thời tiết, Sự cố, Máy móc phát sinh...)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thời tiết mưa bão lúc 16h, thợ nghỉ sơm che chắn bao xi măng..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Đường dẫn ảnh hiện trường lắp ghép (Không bắt buộc)</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Hệ thống sẽ tự cấp ảnh hiện trường sắc nét nếu để trống.</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ghi Sổ Nhật Ký"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
