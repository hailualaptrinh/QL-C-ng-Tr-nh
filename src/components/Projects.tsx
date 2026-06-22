/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ConstructionProject, ProjectStatus, Client, UserRole } from "../types";
import { api } from "../api";
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  MapPin, 
  DollarSign, 
  Calendar, 
  Paperclip,
  Upload,
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  ListFilter
} from "lucide-react";

interface ProjectsProps {
  projects: ConstructionProject[];
  clients: Client[];
  user: any;
  onRefresh: () => void;
  setTab: (tab: string) => void;
  setSelectedProjectIdForTimeline: (id: string) => void;
}

export default function Projects({
  projects,
  clients,
  user,
  onRefresh,
  setTab,
  setSelectedProjectIdForTimeline
}: ProjectsProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedProject, setSelectedProject] = useState<ConstructionProject | null>(null);

  // Forms modal triggers
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  // Project form fields
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDateExpected, setEndDateExpected] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.CHUAN_BI);

  // Doc upload form fields
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<'contract' | 'drawing' | 'document' | 'image'>('document');
  const [docUrl, setDocUrl] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Authorization checks
  const isAuthorizedToCreate = [UserRole.ADMIN, UserRole.PM].includes(user.role as UserRole);
  const isAuthorizedToDelete = user.role === UserRole.ADMIN;
  const isAuthorizedToUpload = [UserRole.ADMIN, UserRole.PM, UserRole.KY_THUAT].includes(user.role as UserRole);

  // Filter projects by search query and state
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.code.toLowerCase().includes(search.toLowerCase()) ||
                          p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
                          p.address.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const openAddProjectModal = () => {
    setName("");
    setOwnerId(clients[0]?.id || "");
    setAddress("");
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDateExpected("");
    setContractValue("");
    setStatus(ProjectStatus.CHUAN_BI);
    setErrorMsg(null);
    setSuccessMsg(null);
    setProjectModalOpen(true);
  };

  const openAddDocModal = (project: ConstructionProject) => {
    setSelectedProject(project);
    setDocName("");
    setDocType("document");
    setDocUrl("");
    setErrorMsg(null);
    setSuccessMsg(null);
    setDocModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerId || !startDate || !endDateExpected || !contractValue) {
      setErrorMsg("Vui lòng nhập đầy đủ các trường thông tin bắt buộc.");
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);
    try {
      await api.createProject({
        name, ownerId, address, startDate, endDateExpected, contractValue, status
      });
      setSuccessMsg("Công trình được khơi dựng thành công!");
      setTimeout(() => {
        setProjectModalOpen(false);
        onRefresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Xảy ra sự cố khi lưu thông tin công trình.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !selectedProject) {
      setErrorMsg("Tên tài liệu là bắt buộc.");
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);

    // Default stock-image placeholders matching the type
    let finalUrl = docUrl;
    if (!finalUrl) {
      if (docType === "drawing") {
        finalUrl = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80";
      } else if (docType === "image") {
        finalUrl = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80";
      } else {
        finalUrl = "#";
      }
    }

    try {
      await api.addDocument(selectedProject.id, {
        name: docName,
        type: docType,
        url: finalUrl
      });
      setSuccessMsg("Upload hồ sơ tài liệu thành công!");
      setTimeout(() => {
        setDocModalOpen(false);
        // Refresh detail view if open
        const updatedProject = projects.find(p => p.id === selectedProject.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
        onRefresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Tải tài liệu thất bại.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Bạn muốn xóa công trình "${name}" không? Toàn bộ nhật ký xây dựng sẽ mất.`)) {
      return;
    }

    try {
      await api.deleteProject(id);
      alert("Xóa công trình thành công!");
      setSelectedProject(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa công trình.");
    }
  };

  const handleDeleteDocument = async (projectId: string, docId: string, docName: string) => {
    if (!window.confirm(`Xóa vĩnh viễn tài liệu "${docName}"?`)) {
      return;
    }

    try {
      await api.deleteDocument(projectId, docId);
      alert("Xóa tài liệu thành công!");
      onRefresh();
      // Update details window representation
      if (selectedProject) {
        setSelectedProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            documents: prev.documents.filter(d => d.id !== docId)
          };
        });
      }
    } catch (err: any) {
      alert(err.message || "Xóa thất bại.");
    }
  };

  const statusColors: Record<ProjectStatus, string> = {
    [ProjectStatus.CHUAN_BI]: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300",
    [ProjectStatus.THI_CONG]: "bg-emerald-100 text-emerald-905 dark:bg-emerald-950 dark:text-emerald-300",
    [ProjectStatus.TAM_DUNG]: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
    [ProjectStatus.HOAN_THANH]: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
    [ProjectStatus.BAO_HANH]: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300",
  };

  return (
    <div className="space-y-6">
      
      {/* Header layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-500" /> QUẢN LÝ DỰ ÁN CÔNG TRÌNH
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chỉ đạo thiết kế thi công vách Panel cách nhiệt và nội ngoại thất Hạnh Phúc Việt
          </p>
        </div>

        {isAuthorizedToCreate && (
          <button
            onClick={openAddProjectModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Công Trình</span>
          </button>
        )}
      </div>

      {/* Filter and searching tool layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm công trình theo tên, địa chỉ hoặc chủ đầu tư..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm bg-transparent border-none outline-none dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-705 shadow-sm flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs font-semibold bg-transparent border-none outline-none dark:text-white"
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            {Object.values(ProjectStatus).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Projects list */}
        <div className="lg:col-span-2 space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400 text-sm">
              Không tìm thấy công trình nào phù hợp.
            </div>
          ) : (
            filteredProjects.map((p) => {
              const totalPhases = p.phases.length;
              const completedPhases = p.phases.filter(ph => ph.status === "done").length;
              const doingPhases = p.phases.filter(ph => ph.status === "doing").length;
              const generalProgress = Math.round(
                p.phases.reduce((acc, ph) => acc + (ph.percentage || 0), 0) / totalPhases
              );

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedProject?.id === p.id
                      ? "bg-rose-50/20 dark:bg-rose-950/15 border-rose-400 dark:border-rose-900 shadow-md"
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-455 block">{p.code}</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize mt-0.5 line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-slate-505 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{p.address}</span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase tracking-wide shrink-0 self-start sm:self-auto ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </div>

                  <hr className="my-3.5 border-slate-100 dark:border-slate-705" />

                  {/* Pricing / Dates block */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-semibold">Chủ đầu tư:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-205 mt-0.5 block">{p.ownerName}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-semibold">Giá trị hợp đồng:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        {p.contractValue.toLocaleString()}đ
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-semibold">Thời hạn thi công:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 block flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-450 text-slate-400" />
                        <span>{p.startDate} ~ {p.endDateExpected}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress slide indicator */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      <span>Tiến độ thực tế ({completedPhases}/{totalPhases} giai đoạn)</span>
                      <span className="text-rose-600 dark:text-rose-450">{generalProgress}% hoàn thiện</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-rose-500 to-rose-600 h-full transition-all duration-300"
                        style={{ width: `${generalProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions to jump to timeline */}
                  <div className="mt-4 flex justify-end gap-2 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectIdForTimeline(p.id);
                        setTab("timeline");
                      }}
                      className="px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                    >
                      Cập nhật tiến độ thiết kế & Gantt Chart →
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Right column: Single project Detail & Document attachments */}
        <div className="lg:col-span-1">
          {selectedProject ? (
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-105 dark:border-slate-700 shadow-sm space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-150 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded uppercase">
                  Chi tiết hồ sơ
                </span>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono text-rose-500 font-bold block">{selectedProject.code}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize mt-0.5">{selectedProject.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5">{selectedProject.address}</p>
              </div>

              {/* Document attachments block */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-slate-400" /> Hồ sơ đính kèm ({selectedProject.documents.length})
                  </h4>

                  {isAuthorizedToUpload && (
                    <button
                      onClick={() => openAddDocModal(selectedProject)}
                      className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                      title="Tải lên tài liệu"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {selectedProject.documents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">Chưa có hồ sơ bản vẽ hoặc hợp đồng tải lên.</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {selectedProject.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="p-2.5 bg-slate-50 dark:bg-slate-705/30 border border-slate-100 dark:border-slate-705 rounded-xl flex items-center justify-between gap-1"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {doc.type === "drawing" || doc.type === "image" ? (
                            <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <div className="overflow-hidden">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-250 block truncate" title={doc.name}>
                              {doc.name}
                            </span>
                            <span className="text-[8px] text-slate-400 block font-mono">Quản lý bởi {doc.uploadedBy}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px]">
                          {doc.url !== "#" ? (
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1 text-rose-600 hover:bg-rose-50 bg-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded shadow-sm flex items-center gap-1 shrink-0 font-medium"
                            >
                              <Eye className="w-3 h-3" /> Xem
                            </a>
                          ) : (
                            <span className="text-[9px] text-slate-400 px-1 py-0.5">Offline</span>
                          )}

                          {isAuthorizedToCreate && (
                            <button
                              onClick={() => handleDeleteDocument(selectedProject.id, doc.id, doc.name)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action layout */}
              {isAuthorizedToDelete && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-end">
                  <button
                    onClick={() => handleDeleteProject(selectedProject.id, selectedProject.name)}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa vĩnh viễn công trình
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-205 dark:border-slate-700 text-slate-405 sticky top-20 text-xs">
              💡 Hãy chọn một công trình bên trái để xem thêm tài liệu và hồ sơ thiết kế, bản vẽ thi công của Hạnh Phúc Việt.
            </div>
          )}
        </div>

      </div>

      {/* Creation Project Modal */}
      {projectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-205">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Khai báo công trình xây dựng mới
              </h3>
              <button onClick={() => setProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tên công trình dự án *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Biệt thự mái thái vách Panel - Long Biên"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Chủ đầu tư liên kết *</label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} - {c.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Địa bàn thi công thực tế</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số 25 Sài Đồng, Long Biên, Hà Nội"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ngày khởi công *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Bàn giao dự kiến *</label>
                    <input
                      type="date"
                      required
                      value={endDateExpected}
                      onChange={(e) => setEndDateExpected(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Giá trị hợp đồng (VND) *</label>
                    <input
                      type="number"
                      required
                      value={contractValue}
                      onChange={(e) => setContractValue(e.target.value)}
                      placeholder="1500000000"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái định giá</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                    >
                      {Object.values(ProjectStatus).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Khai báo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {docModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-205">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide truncate">
                Đính kèm hồ sơ: {selectedProject.code}
              </h3>
              <button onClick={() => setDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 text-xs rounded-lg">
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 text-xs rounded-lg">
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tên văn bản hồ sơ *</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Bản vẽ kết cấu vách ngăn tầng lửng"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phân loại hồ sơ</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    <option value="document">Văn Bản Quy Chuẩn</option>
                    <option value="contract">Bản Sao Hợp Đồng pháp lí</option>
                    <option value="drawing">Bản Vẽ Thiết Kế Kỹ Thuật</option>
                    <option value="image">Hình Ảnh Hiện Trường</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">URL liên kết tập tin (Tùy chọn)</label>
                  <input
                    type="text"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://imgur.com/screenshot.jpg"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Để trống hệ thống sẽ tự sinh placeholder ảnh/bản vẽ chất lượng cao.</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Tải Lên Hệ Thống"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
