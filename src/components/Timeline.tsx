/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ConstructionProject, ConstructionPhase, UserRole } from "../types";
import { api } from "../api";
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  PlayCircle, 
  MinusCircle, 
  Layers, 
  Edit3, 
  X,
  Check,
  Building2,
  Loader2
} from "lucide-react";

interface TimelineProps {
  projects: ConstructionProject[];
  user: any;
  onRefresh: () => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

export default function Timeline({
  projects,
  user,
  onRefresh,
  selectedProjectId,
  setSelectedProjectId
}: TimelineProps) {
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null);

  // Form states to update intermediate phase progress
  const [phasePercentage, setPhasePercentage] = useState<number>(0);
  const [phaseStatus, setPhaseStatus] = useState<'todo' | 'doing' | 'done'>('todo');
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");
  
  const [formLoading, setFormLoading] = useState(false);

  // Check role authorization to update progress (Admin & PM only)
  const isAuthorizedToUpdate = [UserRole.ADMIN, UserRole.PM].includes(user.role as UserRole);

  // Pick active project
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Sync state if active project changed to avoid layout lock
  React.useEffect(() => {
    if (activeProject && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject, selectedProjectId, setSelectedProjectId]);

  const openEditPhaseModal = (index: number, phase: ConstructionPhase) => {
    if (!isAuthorizedToUpdate) return;
    setSelectedPhaseIndex(index);
    setPhasePercentage(phase.percentage || 0);
    setPhaseStatus(phase.status || "todo");
    setPhaseStart(phase.startDate || "");
    setPhaseEnd(phase.endDate || "");
  };

  const handleUpdatePhaseProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || selectedPhaseIndex === null) return;

    setFormLoading(true);

    const updatedPhases = [...activeProject.phases];
    updatedPhases[selectedPhaseIndex] = {
      ...updatedPhases[selectedPhaseIndex],
      percentage: Number(phasePercentage),
      status: phaseStatus,
      startDate: phaseStart || undefined,
      endDate: phaseEnd || undefined
    };

    try {
      await api.updateProject(activeProject.id, {
        phases: updatedPhases
      });
      setSelectedPhaseIndex(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật tiến độ giai đoạn.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" /> TIẾN ĐỘ THI CÔNG & BIỂU ĐỒ GANTT
          </h2>
          <p className="text-xs text-slate-505 dark:text-slate-400 mt-1">
            Theo dõi chi tiết 10 giai đoạn thi công chuẩn mực của Hạnh Phúc Việt
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase">Dự án:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedPhaseIndex(null);
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {activeProject ? (
        <div className="space-y-6">
          
          {/* Main Visual timeline checklist & Gantt Chart split */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Interactive Timeline card list */}
            <div className="xl:col-span-1 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-705 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-550" /> 10 Khối Tiến Trình thi công
                </h3>
                {isAuthorizedToUpdate && (
                  <span className="text-[9px] bg-rose-50 text-rose-600 dark:bg-rose-950/35 dark:text-rose-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                    Bấm bút chì để sửa
                  </span>
                )}
              </div>

              {/* Phases mapped lists styled like high fidelity timeline nodes */}
              <div className="relative pl-6 space-y-4 before:contents-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-700">
                {activeProject.phases.map((ph, idx) => {
                  let statusIcon = <MinusCircle className="w-5 h-5 text-slate-300" />;
                  if (ph.status === "done") {
                    statusIcon = <CheckCircle className="w-5 h-5 text-emerald-500 bg-white dark:bg-slate-800 rounded-full" />;
                  } else if (ph.status === "doing") {
                    statusIcon = <PlayCircle className="w-5 h-5 text-amber-500 bg-white dark:bg-slate-800 rounded-full animate-pulse" />;
                  }

                  return (
                    <div key={idx} className="relative group">
                      {/* Left icon wrapper absolutely positioned */}
                      <span className="absolute -left-6 top-1">
                        {statusIcon}
                      </span>

                      <div className="p-3 bg-slate-50 hover:bg-slate-100/60 dark:bg-slate-705/30 hover:dark:bg-slate-705/50 border border-slate-100 dark:border-transparent rounded-xl flex items-center justify-between gap-2.5 transition-all">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">{ph.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({ph.percentage || 0}%)</span>
                          </div>
                          
                          {(ph.startDate || ph.endDate) && (
                            <span className="text-[9px] text-slate-400 mt-1 block flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-350" />
                              <span>{ph.startDate || "Chưa định"} ~ {ph.endDate || "Chưa định"}</span>
                            </span>
                          )}
                        </div>

                        {isAuthorizedToUpdate && (
                          <button
                            onClick={() => openEditPhaseModal(idx, ph)}
                            className="p-1 text-slate-400 hover:text-rose-505 dark:hover:text-rose-450 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Chỉnh sửa tiến độ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comprehensive Gantt Chart Visual Card */}
            <div className="xl:col-span-2 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-705 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-2">
                  📊 Biểu đồ Gantt trực quan hóa timeline
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Phân rã chu kì thi công (Khảo sát đến Bàn giao bàn giao)</span>

                {/* Grid chart header timeline blocks */}
                <div className="mt-6 border border-slate-100 dark:border-slate-705 rounded-xl overflow-hidden text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  
                  {/* Calendar months indicator header row */}
                  <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-750/50 p-2.5 border-b border-slate-100 dark:border-slate-705">
                    <span className="col-span-4 pl-1">Giai Đọan Thi Công</span>
                    <span className="col-span-8 grid grid-cols-4 text-center text-[9px] font-bold">
                      <span>Tuần 1-2</span>
                      <span>Tuần 3-4</span>
                      <span>Tuần 5-6</span>
                      <span>Tuần 7-8</span>
                    </span>
                  </div>

                  {/* Phases Grid Rows */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-705">
                    {activeProject.phases.map((ph, index) => {
                      // Custom left margin and width offsets designed per index to represent sequential Gantt bars
                      // Highly polished frontend mock flow
                      let startOffset = 0;
                      let barWidth = 20; // default width in percent
                      if (ph.name === "Khảo sát" || ph.name === "Thiết kế") {
                        startOffset = 5;
                        barWidth = 15;
                      } else if (ph.name === "Xin phép") {
                        startOffset = 20;
                        barWidth = 22;
                      } else if (ph.name === "Móng") {
                        startOffset = 38;
                        barWidth = 20;
                      } else if (ph.name === "Khung") {
                        startOffset = 55;
                        barWidth = 25;
                      } else if (ph.name === "Tường Panel") {
                        startOffset = 70;
                        barWidth = 18;
                      } else {
                        // Finishing steps
                        startOffset = 80;
                        barWidth = 15;
                      }

                      let barColor = "bg-rose-500";
                      if (ph.status === "done") {
                        barColor = "bg-emerald-500";
                      } else if (ph.status === "doing") {
                        barColor = "bg-amber-500 animate-pulse";
                      } else {
                        barColor = "bg-slate-200 dark:bg-slate-700";
                      }

                      return (
                        <div key={index} className="grid grid-cols-12 p-3 items-center hover:bg-slate-50/40 dark:hover:bg-slate-705/10 text-slate-700 dark:text-slate-300 font-normal">
                          <span className="col-span-4 text-xs font-bold line-clamp-1">{ph.name}</span>
                          
                          <div className="col-span-8 relative h-4 bg-slate-50/20 rounded">
                            {/* SVG overlay bar based on startOffset & barWidth */}
                            <div
                              className={`absolute h-3 rounded-full top-0.5 leading-none shadow-sm flex items-center justify-center text-[8px] font-bold text-white ${barColor}`}
                              style={{ left: `${startOffset}%`, width: `${barWidth}%` }}
                            >
                              {ph.percentage > 0 && <span>{ph.percentage}%</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* Helpful caption */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] text-slate-500 leading-normal mt-4">
                💡 <b>Chú giải sơ đồ</b>: Trạng thái <b className="text-emerald-505 dark:text-emerald-400">Đã xong (Xanh lá)</b> là giai đoạn hoàn thành 100%. <b className="text-amber-505 text-amber-500">Đang thực hiện (Vàng)</b> thể hiện hiện trường đang thi công thực tế. <b className="text-gray-400">Xám (Chuẩn bị)</b> là các giai đoạn tiếp nối tuần tự.
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 text-slate-400">
          Vui lòng tạo ít nhất một dự án công trình để bắt đầu theo dõi tiến độ thi công.
        </div>
      )}

      {/* Edit Phase Progress Modal */}
      {selectedPhaseIndex !== null && activeProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Cập nhật: {activeProject.phases[selectedPhaseIndex].name}
              </h3>
              <button onClick={() => setSelectedPhaseIndex(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePhaseProgress} className="p-6 space-y-4">
              
              {/* Status input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái thi công</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhaseStatus("todo");
                      setPhasePercentage(0);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      phaseStatus === "todo"
                        ? "border-slate-400 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                        : "border-slate-200 text-slate-400 hover:border-slate-350"
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>Chuẩn bị</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhaseStatus("doing");
                      if (phasePercentage === 100 || phasePercentage === 0) {
                        setPhasePercentage(50);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      phaseStatus === "doing"
                        ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-705 dark:text-amber-450"
                        : "border-slate-200 text-slate-400 hover:border-slate-350"
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Đang làm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhaseStatus("done");
                      setPhasePercentage(100);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      phaseStatus === "done"
                        ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-450"
                        : "border-slate-200 text-slate-400 hover:border-slate-350"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Xong (100%)</span>
                  </button>
                </div>
              </div>

              {/* Percentage input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ % hoàn thiện</label>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-450">{phasePercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={phasePercentage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPhasePercentage(val);
                    if (val === 100) {
                      setPhaseStatus("done");
                    } else if (val > 0) {
                      setPhaseStatus("doing");
                    } else {
                      setPhaseStatus("todo");
                    }
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-650 accent-rose-600"
                />
              </div>

              {/* Start and end dates block */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Khởi tạo</label>
                  <input
                    type="date"
                    value={phaseStart}
                    onChange={(e) => setPhaseStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Dự kiến xong</label>
                  <input
                    type="date"
                    value={phaseEnd}
                    onChange={(e) => setPhaseEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>
              </div>

              {/* Action layout */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhaseIndex(null)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-605 text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cập nhật tiến trình"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
