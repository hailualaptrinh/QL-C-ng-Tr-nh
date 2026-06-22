/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Contract, Client, UserRole } from "../types";
import { api } from "../api";

export interface PaymentMilestone {
  milestone: string;
  percentage?: number;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
}
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  X,
  PlusCircle, 
  Loader2,
  AlertTriangle,
  UserCheck
} from "lucide-react";

interface ContractsProps {
  contracts: Contract[];
  clients: Client[];
  user: any;
  onRefresh: () => void;
}

export default function Contracts({
  contracts,
  clients,
  user,
  onRefresh
}: ContractsProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Contract form fields
  const [contractNo, setContractNo] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [signDate, setSignDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  // Payment Milestones dynamic list inside form
  const [milestones, setMilestones] = useState<Omit<PaymentMilestone, 'id' | 'paidAt'>[]>([
    { milestone: "Tạm ứng đợt 1 (Động thổ móng)", amount: 300000000, dueDate: "", status: "unpaid" },
    { milestone: "Thanh toán đợt 2 (Thi công vách Panel)", amount: 500000000, dueDate: "", status: "unpaid" }
  ]);

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authorization checks (Admin, PM, Accountant can register)
  const isAuthorizedToManage = [UserRole.ADMIN, UserRole.PM, UserRole.KE_TOAN].includes(user.role as UserRole);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => 
      c.contractNo.toLowerCase().includes(search.toLowerCase()) ||
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.projectName.toLowerCase().includes(search.toLowerCase())
    );
  }, [contracts, search]);

  const openAddContractModal = () => {
    setContractNo(`HDPV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setClientId(clients[0]?.id || "");
    setProjectName("");
    setTotalValue("");
    setSignDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setMilestones([
      { milestone: "Tạm ứng đợt 1 (Động thổ móng)", amount: 350000000, dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0], status: "unpaid" },
      { milestone: "Thanh toán đợt 2 (Lắp ghép vách Panel)", amount: 650000000, dueDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0], status: "unpaid" }
    ]);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleAddMilestoneInForm = () => {
    setMilestones([...milestones, { milestone: `Đợt thanh toán thứ ${milestones.length + 1}`, amount: 0, dueDate: "", status: "unpaid" }]);
  };

  const handleRemoveMilestoneInForm = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleMilestoneFieldChange = (idx: number, field: keyof typeof milestones[0], value: any) => {
    const updated = [...milestones];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setMilestones(updated);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNo || !clientId || !projectName || !totalValue) {
      setErrorMsg("Vui lòng điền đầy đủ số hợp đồng, chủ đầu tư, tên dự án và giá trị.");
      return;
    }

    const sumMilestones = milestones.reduce((sum, m) => sum + Number(m.amount), 0);
    if (sumMilestones !== Number(totalValue)) {
      setErrorMsg(`Tổng giá trị các đợt thanh toán (${sumMilestones.toLocaleString()}đ) khác với tổng giá trị hợp đồng (${Number(totalValue).toLocaleString()}đ).`);
      return;
    }

    setFormLoading(true);
    try {
      await api.createContract({
        contractNo,
        clientId,
        projectName,
        totalValue: Number(totalValue),
        signDate,
        notes,
        paymentMilestones: milestones.map(m => ({ ...m, amount: Number(m.amount) }))
      });
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tạo hợp đồng.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleMilestonePaid = async (contractId: string, milestoneIndex: number, currentStatus: 'paid' | 'unpaid') => {
    const targetStatus = currentStatus === "paid" ? "unpaid" : "paid";
    if (!window.confirm(`Xác nhận đánh dấu đợt thanh toán này là: ${targetStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}?`)) {
      return;
    }

    try {
      await api.updateMilestone(contractId, milestoneIndex, { status: targetStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật tiến trình thanh lý.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" /> SỔ QUẢN LÝ HỢP ĐỒNG & CÔNG NỢ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Định ước lộ trình giải ngân, thanh lý hồ sơ thiết kế thi công của Hạnh Phúc Việt
          </p>
        </div>

        {isAuthorizedToManage && (
          <button
            onClick={openAddContractModal}
            className="px-4 py-2 bg-rose-650 hover:bg-rose-700 bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Khai Hợp Đồng</span>
          </button>
        )}
      </div>

      {/* Searching interface input */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-404 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm hợp đồng theo mã hợp đồng, tên khách hàng hoặc dự án căn hộ xây dựng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm bg-transparent border-none outline-none dark:text-white"
        />
      </div>

      {/* Contracts collection display */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredContracts.length === 0 ? (
          <div className="xl:col-span-2 p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 text-slate-400">
            Chưa tìm được hợp đồng pháp lý nào phù hợp.
          </div>
        ) : (
          filteredContracts.map((con) => {
            const sumMilestones = con.paymentMilestones.reduce((acc, m) => acc + m.amount, 0);
            const sumPaid = con.paymentMilestones.filter(m => m.status === 'paid').reduce((acc, m) => acc + m.amount, 0);
            const paidPercentage = Math.round((sumPaid / sumMilestones) * 100) || 0;

            return (
              <div key={con.id} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                
                {/* Header contract info */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-rose-500 block uppercase">{con.contractNo}</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">{con.projectName}</h3>
                    <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Khách hàng đại diện: {con.clientName}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">Ngày ký: {con.signDate}</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-450 block mt-1 font-mono">
                      {con.totalValue.toLocaleString()}đ
                    </span>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-705" />

                {/* Progress bar representing received money */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-505 uppercase tracking-wide mb-1.5">
                    <span>Đã giải ngân đợt ({sumPaid.toLocaleString()}đ)</span>
                    <span className="text-emerald-600 dark:text-emerald-450">{paidPercentage}% đã thu</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all"
                      style={{ width: `${paidPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Milestones dynamic checker items list */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Lộ trình các đợt giải ngân hợp đồng ({con.paymentMilestones.length})
                  </h4>

                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {con.paymentMilestones.map((ms, index) => {
                      const isPaid = ms.status === "paid";
                      return (
                        <div 
                          key={index} 
                          className="p-2.5 bg-slate-5.0 bg-slate-50 dark:bg-slate-750/35 border border-slate-100 dark:border-transparent rounded-xl flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-205 block">{ms.milestone}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Ḥn thanh toán: {ms.dueDate || "Chưa quy định"}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-extrabold text-slate-800 dark:text-slate-300">
                              {ms.amount.toLocaleString()}đ
                            </span>

                            {isAuthorizedToManage ? (
                              <button
                                onClick={() => handleToggleMilestonePaid(con.id, index, ms.status)}
                                className={`px-2 py-1.5 rounded-lg text-[9px] font-extrabold uppercase shrink-0 transition-all ${
                                  isPaid
                                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-amber-55 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 animate-pulse"
                                }`}
                              >
                                {isPaid ? "Đã thu" : "Chưa thu"}
                              </button>
                            ) : (
                              <span className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase ${
                                isPaid ? "text-emerald-650" : "text-amber-600"
                              }`}>
                                {isPaid ? "Đã xong" : "Chờ"}
                              </span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {con.notes && (
                  <p className="text-[10px] text-slate-404 text-slate-400 bg-slate-50 dark:bg-slate-705/20 p-2 rounded italic">
                    💡 <b>Điều khoản phụ:</b> {con.notes}
                  </p>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Contract Creation Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-150 dark:border-slate-700 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-905 dark:text-white uppercase tracking-wide">
                Đăng ký hợp đồng thi công mới
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-953 text-red-650 text-xs rounded-lg flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Số hiệu hợp đồng *</label>
                    <input
                      type="text"
                      required
                      value={contractNo}
                      onChange={(e) => setContractNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5 font-sans">Ngày hiệu lực *</label>
                    <input
                      type="date"
                      required
                      value={signDate}
                      onChange={(e) => setSignDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-455 text-slate-400 mb-1.5">Chủ đầu tư ký kết *</label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName} - {c.code}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Tên dự án thi công *</label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Thi công biệt thự Panel Ecopark"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Tổng giá trị hợp đồng (VND) *</label>
                  <input
                    type="number"
                    required
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    placeholder="100000000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Điều khoản ghi chú</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bảo hành tấm Panel EPS EPS 24 tháng theo chuẩn..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                {/* Milestones dynamic build config inside flow */}
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Các đợt mở giải ngân</span>
                    <button
                      type="button"
                      onClick={handleAddMilestoneInForm}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-705 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] rounded font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm đợt
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto">
                    {milestones.map((m, index) => (
                      <div key={index} className="p-3 bg-slate-50 dark:bg-slate-750/35 border border-slate-100 dark:border-transparent rounded-xl space-y-2 relative">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span>Đợt {index + 1}</span>
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestoneInForm(index)}
                              className="text-red-500 hover:underline"
                            >
                              Xóa
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="sm:col-span-1">
                            <input
                              type="text"
                              required
                              value={m.milestone}
                              onChange={(e) => handleMilestoneFieldChange(index, "milestone", e.target.value)}
                              placeholder="Mô tả đợt..."
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-[11px]"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <input
                              type="number"
                              required
                              value={m.amount}
                              onChange={(e) => handleMilestoneFieldChange(index, "amount", Number(e.target.value))}
                              placeholder="Giá tiền..."
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-[11px]"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <input
                              type="date"
                              required
                              value={m.dueDate}
                              onChange={(e) => handleMilestoneFieldChange(index, "dueDate", e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-[11px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Tạo Hợp Đồng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
