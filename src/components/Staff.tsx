/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Staff, ConstructionProject, UserRole } from "../types";
import { api } from "../api";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Phone, 
  FolderSync, 
  CheckCircle, 
  UserPlus, 
  UserMinus, 
  Calendar, 
  Clock, 
  Smile,
  X,
  Loader2,
  Lock,
  Edit2
} from "lucide-react";

interface StaffProps {
  staff: Staff[];
  projects: ConstructionProject[];
  user: any;
  onRefresh: () => void;
}

export default function StaffPanel({ staff, projects, user, onRefresh }: StaffProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  // Staff Form fields state
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("Thi công");
  const [phone, setPhone] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState("");

  // Attendance Form fields state
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Role Permissions checked
  const isAuthorizedToManage = [UserRole.ADMIN, UserRole.PM].includes(user.role as UserRole);
  const isAuthorizedToDelete = user.role === UserRole.ADMIN;

  // Search filter
  const filteredStaff = useMemo(() => {
    return staff.filter(s => 
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.position.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
    );
  }, [staff, search]);

  const openAddModal = () => {
    setEditingStaff(null);
    setFullName("");
    setPosition("");
    setDepartment("Thi công");
    setPhone("");
    setCurrentProjectId(projects[0]?.id || "");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    setFullName(s.fullName);
    setPosition(s.position);
    setDepartment(s.department);
    setPhone(s.phone);
    setCurrentProjectId(s.currentProjectId || "");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openAttendanceModal = (s: Staff) => {
    setSelectedStaff(s);
    setAttDate(new Date().toISOString().split('T')[0]);
    setAttStatus("present");
    setOvertimeHours(0);
    setNotes("");
    setAttendanceModalOpen(true);
  };

  const handleSaveStaffStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !position || !department || !phone) {
      setErrorMsg("Vui lòng nhập đầy đủ các thông tin bắt buộc.");
      return;
    }

    setFormLoading(true);
    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.id, {
          fullName,
          position,
          department,
          phone,
          currentProjectId: currentProjectId || undefined
        });
      } else {
        await api.createStaff({
          fullName,
          position,
          department,
          phone,
          currentProjectId: currentProjectId || undefined
        });
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Xảy ra lỗi trong khi xử lý.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !attDate) return;

    setFormLoading(true);
    try {
      await api.addAttendance(selectedStaff.id, {
        date: attDate,
        status: attStatus,
        overtimeHours: Number(overtimeHours),
        notes
      });
      setAttendanceModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Lỗi lưu chấm công.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên "${name}" ra khỏi hồ sơ hệ thống?`)) {
      return;
    }

    try {
      await api.deleteStaff(id);
      alert("Xóa nhân viên thành công!");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa nhân viên.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" /> QUẢN LÝ NHÂN SỰ & CHẤM CÔNG GIAO VIỆC
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thông tin nhân sự, chấm công hiện thực, cấp điều hành công trình</p>
        </div>

        {isAuthorizedToManage && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Nhân Viên</span>
          </button>
        )}
      </div>

      {/* Search component */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm nhân viên hỏa tốc theo mã cá nhân, họ tên, điện thoại bàn hoặc phòng ban..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Employee List table with customized UI */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-705 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3">Mã NV</th>
                <th className="px-5 py-3">Họ và Tên</th>
                <th className="px-5 py-3">Chức Vụ</th>
                <th className="px-5 py-3">Phòng Ban</th>
                <th className="px-5 py-3">Số Điện Thoại</th>
                <th className="px-5 py-3">Địa điểm điều động</th>
                <th className="px-5 py-3 text-right">Lựa chọn hàng ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-xs">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Không tìm thấy cán bộ nhân viên nào.</td>
                </tr>
              ) : (
                filteredStaff.map((employee) => {
                  const assignedProj = projects.find(p => p.id === employee.currentProjectId);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-rose-600 dark:text-rose-450">{employee.code}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white text-[10px] font-bold flex items-center justify-center">
                            {employee.fullName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block capitalize">{employee.fullName}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">Hàng ngày</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-850 dark:text-slate-300">{employee.position}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-750 text-slate-650 dark:text-slate-300 rounded font-semibold text-[10px]">
                          {employee.department}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-500 whitespace-nowrap">{employee.phone}</td>
                      <td className="px-5 py-4">
                        {assignedProj ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-semibold" title={assignedProj.name}>
                            <FolderSync className="w-3.5 h-3.5 shrink-0" />
                            <span className="line-clamp-1 max-w-[150px]">{assignedProj.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa điều động dọn đất</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {isAuthorizedToManage && (
                            <>
                              <button
                                onClick={() => openAttendanceModal(employee)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] uppercase font-extrabold flex items-center gap-1 shrink-0"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Chấm Công
                              </button>

                              <button
                                onClick={() => openEditModal(employee)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 text-slate-550 dark:text-slate-304 hover:dark:text-white rounded"
                                title="Chỉnh sửa nhân viên"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isAuthorizedToDelete && (
                            <button
                              onClick={() => handleDeleteStaff(employee.id, employee.fullName)}
                              className="p-1.5 bg-slate-55 bg-rose-50 hover:bg-rose-100 text-rose-550 dark:bg-rose-950/20 rounded text-slate-400 hover:text-rose-500 shrink-0"
                              title="Xóa nhân viên"
                            >
                              <UserMinus className="w-3.5 h-3.5 text-rose-550" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                {editingStaff ? `Chỉnh sửa: ${editingStaff.code}` : "Đăng ký cán bộ nhân viên mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffStatus} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Họ tên nhân viên *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vũ Văn Lực"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Chức danh công tác *</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Chỉ huy lắp đà thép"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Bộ phận / Phòng ban *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    <option value="Thi công">Bộ Phận Thi Công</option>
                    <option value="Kỹ thuật">Ban Giám Sát Kỹ Thuật</option>
                    <option value="Tài chính">Tài Chính Kế Toán</option>
                    <option value="Hành chính">Hành Chính Tổng Hợp</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0977888999"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Điều động dự án xây dựng</label>
                  <select
                    value={currentProjectId}
                    onChange={(e) => setCurrentProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    <option value="">Chưa điều động —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-605 text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ghi Nhận Nhân Nhân"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Checkin Modal */}
      {attendanceModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Chấm công: {selectedStaff.fullName}
              </h3>
              <button onClick={() => setAttendanceModalOpen(false)} className="text-slate-405 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Ngày chấm công</label>
                  <input
                    type="date"
                    required
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Trạng thái điểm danh</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAttStatus("present")}
                      className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                        attStatus === "present"
                          ? "border-emerald-500 bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-400"
                          : "border-slate-200 hover:border-slate-350 dark:border-slate-700"
                      }`}
                    >
                      Đi làm (Có mặt)
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttStatus("leave")}
                      className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                        attStatus === "leave"
                          ? "border-amber-500 bg-amber-50/55 dark:bg-amber-950/20 text-amber-705 dark:text-amber-400"
                          : "border-slate-200 hover:border-slate-350 dark:border-slate-700"
                      }`}
                    >
                      Nghỉ phép (Có báo)
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttStatus("absent")}
                      className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                        attStatus === "absent"
                          ? "border-red-500 bg-red-50/55 dark:bg-red-950/20 text-red-705 dark:text-red-400"
                          : "border-slate-200 hover:border-slate-350 dark:border-slate-700"
                      }`}
                    >
                      Vắng mặt (Tự ý)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Giờ làm việc tăng ca hôm nay</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="8"
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(Number(e.target.value))}
                      className="w-20 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white font-mono"
                    />
                    <span className="text-xs text-slate-500">Tiếng (Giờ làm thêm hỗ trợ hệ móng/panel)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Ghi chú bổ sung</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Làm về muộn hỗ trợ đổ móng phụ..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Xác Nhận Chấm Công"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
