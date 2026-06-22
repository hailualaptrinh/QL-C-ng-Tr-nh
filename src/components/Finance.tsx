/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CashTransaction, ConstructionProject, UserRole } from "../types";
import { api } from "../api";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  TrendingDown, 
  FileSpreadsheet, 
  Clock, 
  CheckCheck,
  Building2,
  X,
  Loader2
} from "lucide-react";

interface FinanceProps {
  transactions: CashTransaction[];
  projects: ConstructionProject[];
  user: any;
  onRefresh: () => void;
}

export default function Finance({
  transactions,
  projects,
  user,
  onRefresh
}: FinanceProps) {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form state
  const [type, setType] = useState<'thu' | 'chi'>('thu');
  const [category, setCategory] = useState<'payment' | 'advance' | 'material' | 'labor' | 'machinery' | 'other'>('payment');
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authorization checks (Admin & Accountant can register flows)
  const isAuthorizedToManage = [UserRole.ADMIN, UserRole.KE_TOAN].includes(user.role as UserRole);
  const isAdmin = user.role === UserRole.ADMIN;

  // Stats calculation
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      if (t.type === 'thu') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });
    return {
      totalIncome,
      totalExpense,
      totalProfit: totalIncome - totalExpense
    };
  }, [transactions]);

  const openAddModal = () => {
    setType("thu");
    setCategory("payment");
    setProjectId(projects[0]?.id || "");
    setAmount("");
    setDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) {
      setErrorMsg("Vui lòng nhập đầy đủ giá tiền và ngày giao dịch.");
      return;
    }

    setFormLoading(true);
    try {
      await api.createCashTransaction({
        type,
        category,
        projectId: projectId || undefined,
        amount: Number(amount),
        date,
        notes
      });
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể khởi dựng dòng tiền tài chính.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleApproveAllCosts = async () => {
    if (!window.confirm("Phê diệt thanh lý toàn bộ báo cáo chi phí phát sinh trong tuần này?")) {
      return;
    }
    try {
      await api.approveExpenses();
      alert("Hệ thống đã tự động phê diệt chi phí thành công!");
      onRefresh();
    } catch (err: any) {
      alert("Phê duyệt xảy ra lỗi.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-500" /> SỔ QUẢN LÝ THU CHI TÀI CHÍNH
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">Định hình ngân sách đầu tư, tạm ứng chủ đầu tư và thanh toán nhà thầu vật tư nhân công</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <button
              onClick={handleApproveAllCosts}
              className="px-3.5 py-2 check border border-slate-200 dark:border-slate-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              title="Phê duyệt toàn quyền chi phí"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Phê duyệt chi phí</span>
            </button>
          )}

          {isAuthorizedToManage && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Giao Dịch</span>
            </button>
          )}
        </div>
      </div>

      {/* Cashflow Statistics Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Tổng thu */}
        <div className="p-5 bg-white dark:bg-slate-805 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Lũy kế tổng thu (Doanh thu)</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-450 mt-1.5 block">
              +{metrics.totalIncome.toLocaleString()}đ
            </span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-605 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Tổng chi */}
        <div className="p-5 bg-white dark:bg-slate-805 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Luỹ kế tổng chi (Chi phí)</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1.5 block">
              -{metrics.totalExpense.toLocaleString()}đ
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-605 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Lợi nhuận */}
        <div className="p-5 bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl text-white shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lợi nhuận ròng dự toán</span>
            <span className="text-xl font-black text-blue-400 mt-1.5 block">
              +{metrics.totalProfit.toLocaleString()}đ
            </span>
          </div>
          <div className="p-3 bg-slate-800 dark:bg-slate-800 text-blue-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transaction table display */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-705 shadow-sm overflow-hidden">
        <h3 className="p-5 header border-b border-slate-100 dark:border-slate-705 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" /> Danh sách phát sinh dòng tiền (Lịch sử giao dịch)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-705 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3">Loại</th>
                <th className="px-5 py-3">Phân loại chi tiết</th>
                <th className="px-5 py-3">Dự án công trình</th>
                <th className="px-5 py-3">Số Tiền (VND)</th>
                <th className="px-5 py-3">Ngày Giao Dịch</th>
                <th className="px-5 py-3">Người ghi nhận</th>
                <th className="px-5 py-3">Mô tả hạch toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-xs">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Chưa ghi nhận dòng tiền tài chính nào.</td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isThu = tx.type === "thu";
                  const categoryLabels: Record<string, string> = {
                    payment: "Thu thanh toán",
                    advance: "Chủ đầu tư tạm ứng",
                    material: "Chi mua vật tư",
                    labor: "Chi phí nhân công thợ",
                    machinery: "Thuê máy móc thiết bị",
                    other: "Chi phí linh hoạt khác"
                  };

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1 w-14 ${
                          isThu 
                            ? "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400" 
                            : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                        }`}>
                          {isThu ? <ArrowDownLeft className="w-3 h-3 text-rose-500" /> : <ArrowUpRight className="w-3 h-3 text-emerald-500" />} {tx.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {categoryLabels[tx.category] || tx.category}
                      </td>

                      <td className="px-5 py-4 text-slate-550 max-w-[180px] truncate" title={tx.projectName}>
                        {tx.projectName ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {tx.projectName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Doanh nghiệp</span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono font-bold">
                        <span className={isThu ? "text-rose-600 dark:text-rose-450" : "text-emerald-600 dark:text-emerald-450"}>
                          {isThu ? "+" : "-"}{tx.amount.toLocaleString()}đ
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-450">{tx.date}</td>
                      <td className="px-5 py-4 text-slate-500 font-semibold">{tx.performedBy}</td>
                      <td className="px-5 py-4 text-slate-400 italic max-w-[200px] truncate" title={tx.notes}>{tx.notes || "—"}</td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Transaction flow modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Ghi chép giao dịch tài chính mới
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg">{errorMsg}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Loại hình dòng tiền *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setType("thu");
                        setCategory("payment");
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        type === "thu"
                          ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-705 dark:text-rose-400"
                          : "border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      Dòng Thu (+)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setType("chi");
                        setCategory("material");
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        type === "chi"
                          ? "border-emerald-500 bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-400"
                          : "border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      Dòng Chi (-)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Phân loại chi tiết *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    {type === "thu" ? (
                      <>
                        <option value="payment">Thu thanh toán đợt thanh lí</option>
                        <option value="advance">Chủ đầu tư tạm ứng giải ngân</option>
                        <option value="other">Thu tài trợ khác</option>
                      </>
                    ) : (
                      <>
                        <option value="material">Thanh toán nhà sản xuất vật tư</option>
                        <option value="labor">Tạm ứng nhân công lắp dựng thợ</option>
                        <option value="machinery">Thuê máy múc, cẩu nâng hiện trường</option>
                        <option value="other">Các dòng chi phí khác phát sinh</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Khai chỉ gắn với dự án (Nếu có)</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                  >
                    <option value="">Chi ngân sách văn phòng —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Số tiền giao dịch (VND) *</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="15000000"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Ngày hạch toán *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Ghi chú bổ sung diễn giải</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mô tả cụ thể người nhận, chứng từ hóa đơn phụ..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                  />
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ghi Sổ Giao Dịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
