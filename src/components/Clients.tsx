/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Client, UserRole } from "../types";
import { api } from "../api";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  Loader2, 
  Check, 
  AlertCircle, 
  X,
  UserCheck
} from "lucide-react";

interface ClientsProps {
  clients: Client[];
  user: any;
  onRefresh: () => void;
}

export default function Clients({ clients, user, onRefresh }: ClientsProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form fields state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [idCard, setIdCard] = useState("");
  const [notes, setNotes] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check role authorization to manage (admin, PM, accountant can edit/create)
  const isAuthorizedToManage = [UserRole.ADMIN, UserRole.PM, UserRole.KE_TOAN].includes(user.role as UserRole);
  const isAuthorizedToDelete = user.role === UserRole.ADMIN;

  // Search filter
  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.idCard.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  const openAddModal = () => {
    setEditingClient(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setIdCard("");
    setNotes("");
    setErrorMsg(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFullName(client.fullName);
    setPhone(client.phone);
    setEmail(client.email);
    setAddress(client.address);
    setIdCard(client.idCard);
    setNotes(client.notes || "");
    setErrorMsg(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !idCard) {
      setErrorMsg("Vui lòng điền Họ tên, Số điện thoại và CMND/CCCD.");
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);
    try {
      if (editingClient) {
        // Edit action
        await api.updateClient(editingClient.id, {
          fullName, phone, email, address, idCard, notes
        });
        setSuccessMsg("Cập nhật thông tin khách hàng thành công!");
      } else {
        // Add action
        await api.createClient({
          fullName, phone, email, address, idCard, notes
        });
        setSuccessMsg("Thêm khách hàng thành công!");
      }
      setTimeout(() => {
        setModalOpen(false);
        onRefresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Quá trình ghi nhận thất bại. Hãy kiểm tra lại.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khách hàng "${name}" không? Hành động này sẽ xóa vĩnh viễn dữ liệu.`)) {
      return;
    }

    try {
      await api.deleteClient(id);
      alert("Xóa thành công!");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Xóa không thành công.");
    }
  };

  // Automated Excel Export simulator
  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // CSV Header with Vietnamese accent support prefix
    csvContent += "\uFEFF";
    csvContent += "Mã KH,Họ và Tên,Số Điện Thoại,Email,Địa Chỉ,Số CMND/CCCD,Ghi chú\n";
    
    clients.forEach(c => {
      csvContent += `"${c.code}","${c.fullName}","${c.phone}","${c.email}","${c.address}","${c.idCard}","${c.notes || ""}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DANH_SACH_KHACH_HANG_HANH_PHUC_VIET.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top action layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-rose-650 text-rose-500" /> QUẢN LÝ THÔNG TIN KHÁCH HÀNG
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Danh sách đối tác & chủ đầu tư hợp đồng xây dựng Hạnh Phúc Việt</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Excel export action button */}
          <button
            onClick={exportToExcel}
            className="px-3.5 py-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Xuất Excel (.csv)</span>
          </button>

          {isAuthorizedToManage && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow shadow-rose-950/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khách Hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* Searching interface */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm nhanh khách hàng theo tên, số điện thoại, số CCCD hoặc địa chỉ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Main clients list grid/table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-705 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3">Mã KH</th>
                <th className="px-5 py-3">Họ và Tên</th>
                <th className="px-5 py-3">Số Điện Thoại</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Số CCCD/CMND</th>
                <th className="px-5 py-3">Địa Chỉ</th>
                <th className="px-5 py-3">Ghi Chú</th>
                {isAuthorizedToManage && <th className="px-5 py-3 text-right">Lựa chọn</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">Không tìm thấy khách hàng nào.</td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 text-slate-700 dark:text-slate-300 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-rose-600 dark:text-rose-450">{c.code}</td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white capitalize">{c.fullName}</td>
                    <td className="px-5 py-4 font-mono">{c.phone}</td>
                    <td className="px-5 py-4 text-slate-500 truncate max-w-[150px]">{c.email || "—"}</td>
                    <td className="px-5 py-4 font-mono">{c.idCard}</td>
                    <td className="px-5 py-4 text-slate-500 truncate max-w-[200px]" title={c.address}>{c.address || "—"}</td>
                    <td className="px-5 py-4 text-slate-400 italic max-w-[150px] truncate">{c.notes || "—"}</td>
                    
                    {isAuthorizedToManage && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(c)}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-200 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {isAuthorizedToDelete && (
                            <button
                              onClick={() => handleDelete(c.id, c.fullName)}
                              title="Xóa vĩnh viễn"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-650 dark:text-rose-450 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                {editingClient ? `Cập nhật: ${editingClient.code}` : "Khai báo khách hàng mới"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-400 text-xs rounded-lg flex items-center gap-2 border border-red-100/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-655 dark:text-emerald-450 text-xs rounded-lg flex items-center gap-2 border border-emerald-100/30">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Họ tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912xxxxxx"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mã số CMND/CCCD *</label>
                  <input
                    type="text"
                    required
                    value={idCard}
                    onChange={(e) => setIdCard(e.target.value)}
                    placeholder="012345678901"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hộp thư điện tử (Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số 10, Đường Ngũ Nhạc, Quận Hoàng Mai, Hà Nội"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ghi chú đối tác</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập thông tin giao thông bổ sung, sở thích, yêu cầu thiết kế..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Action layout */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl transition-all"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow shadow-rose-950/10"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>Lưu Hồ Sơ</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
