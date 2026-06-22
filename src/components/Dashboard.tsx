/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  BellRing, 
  ArrowRight, 
  CheckCircle,
  Clock,
  ShieldAlert,
  FolderDot
} from "lucide-react";
import { 
  ConstructionProject, 
  Material, 
  CashTransaction, 
  NotificationLog, 
  ProjectStatus, 
  Contract,
  UserRole
} from "../types";

interface DashboardProps {
  projects: ConstructionProject[];
  materials: Material[];
  transactions: CashTransaction[];
  contracts: Contract[];
  notifications: NotificationLog[];
  user: any;
  setTab: (tab: string) => void;
}

export default function Dashboard({
  projects,
  materials,
  transactions,
  contracts,
  notifications,
  user,
  setTab
}: DashboardProps) {

  // Statistics calculation
  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter(p => p.status === ProjectStatus.THI_CONG).length;
    const completed = projects.filter(p => p.status === ProjectStatus.HOAN_THANH).length;
    const warranty = projects.filter(p => p.status === ProjectStatus.BAO_HANH).length;

    // Monthly finance aggregate
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      if (t.type === 'thu') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });
    const totalProfit = totalIncome - totalExpense;

    return {
      total,
      inProgress,
      completed,
      warranty,
      totalIncome,
      totalExpense,
      totalProfit
    };
  }, [projects, transactions]);

  // Upcoming handovers
  const upcomingHandovers = useMemo(() => {
    return projects
      .filter(p => p.status === ProjectStatus.THI_CONG)
      .map(p => {
        const dExpected = new Date(p.endDateExpected);
        const daysLeft = Math.ceil((dExpected.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return { ...p, daysLeft };
      })
      .filter(p => p.daysLeft > 0 && p.daysLeft <= 60)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [projects]);

  // Low stock warning materials
  const lowMaterials = useMemo(() => {
    return materials.filter(m => m.stock < m.minStock).slice(0, 4);
  }, [materials]);

  // Upcoming unpaid payment milestones in the next 30 days
  const pendingPayments = useMemo(() => {
    const list: Array<{ contractNo: string; clientName: string; milestone: string; amount: number; dueDate: string }> = [];
    contracts.forEach(c => {
      c.paymentMilestones.forEach(m => {
        if (m.status === 'unpaid') {
          list.push({
            contractNo: c.contractNo,
            clientName: c.clientName,
            milestone: m.milestone,
            amount: m.amount,
            dueDate: m.dueDate
          });
        }
      });
    });
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 4);
  }, [contracts]);

  // Today schedule tasks
  const todayTasks = [
    { id: 1, text: "Kiểm tra nghiệm thu hố móng CT001 Văn Quán", done: false, assignee: "Đỗ Gia Huy (Kỹ thuật)" },
    { id: 2, text: "Nhập xưởng cấp vách Panel EPS 50mm cách nhiệt", done: true, assignee: "Hoàng Văn Khoa (Kho)" },
    { id: 3, text: "Lên báo cáo thu chi & xuất hóa đơn đợt 2 CT003", done: false, assignee: "Lê Thị Thảo (Kế toán)" },
    { id: 4, text: "Họp rà soát tiến độ nhà thầu phụ thép xưởng Thái Bình", done: false, assignee: "Phạm Minh Trí (PM)" },
  ];

  // Colors mapping for status badges
  const statusColors: Record<ProjectStatus, string> = {
    [ProjectStatus.CHUAN_BI]: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    [ProjectStatus.THI_CONG]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    [ProjectStatus.TAM_DUNG]: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    [ProjectStatus.HOAN_THANH]: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
    [ProjectStatus.BAO_HANH]: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">BẢNG ĐIỀU KHIỂN CHUYÊN NGHIỆP</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chào mừng lại hệ thống, <span className="font-bold text-slate-700 dark:text-slate-300">{user.fullName}</span> ({user.role})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            Hôm nay: {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Grid STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-tight">Tổng Công Trình</span>
            <div className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</span>
            <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">+12%</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-tight">Đang thi công</span>
            <div className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-red-600 dark:text-red-400 leading-none">{stats.inProgress < 10 ? `0${stats.inProgress}` : stats.inProgress}</span>
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse self-center mb-1"></span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-tight">Đã Hoàn Thành</span>
            <div className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.completed}</span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold">Tích lũy</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all flex flex-col justify-between h-[120px] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-tight">Đang Bảo Hành</span>
            <div className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
              <FolderDot className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.warranty < 10 ? `0${stats.warranty}` : stats.warranty}</span>
            <span className="text-orange-500 text-[10px] font-bold">Theo dõi</span>
          </div>
        </div>
      </div>

      {/* Financial high level metrics (Giám đốc / Admin / Kế toán see details) */}
      {[UserRole.ADMIN, UserRole.GIAM_DOC, UserRole.KE_TOAN].includes(user.role as UserRole) && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-extrabold">Luỹ Kế Doanh Thu Hệ Thống</span>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded">LỢI NHUẬN +18%</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 flex items-baseline gap-1.5">
                {stats.totalIncome.toLocaleString()} <span className="text-xs font-normal text-slate-500">VND</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 md:gap-8 min-w-[240px] md:border-l md:border-slate-200 dark:md:border-slate-750 md:pl-8">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">DOANH THU THỰC SỰ</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{(stats.totalIncome / 1000000).toFixed(1)}Mđ</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">CHI PHÍ ĐÃ CHI</span>
                <p className="text-xl font-extrabold text-red-600 mt-1">-{(stats.totalExpense / 1000000).toFixed(1)}Mđ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom SVG line Chart */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Báo Cáo Doanh Thu, Chi Phí & Lợi Nhuận</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Xu hướng biến động giai đoạn Quý 2/2026</p>
              </div>
              {/* Chart Legends */}
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-2.5 h-2.5 rounded bg-red-500" /> Doanh thu
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Chi phí
                </span>
                <span className="flex items-center gap-1 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded bg-blue-550 bg-blue-500" /> Lợi nhuận
                </span>
              </div>
            </div>

            {/* Core Custom SVG Vector Graphic Chart representing financial statistics */}
            <div className="relative h-60 w-full mt-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2 border border-slate-200 dark:border-slate-700/30 overflow-hidden">
              <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="50" y1="20" x2="480" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" className="dark:stroke-slate-750" />
                <line x1="50" y1="70" x2="480" y2="70" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" className="dark:stroke-slate-755" />
                <line x1="50" y1="120" x2="480" y2="120" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" className="dark:stroke-slate-755" />
                <line x1="50" y1="170" x2="480" y2="170" stroke="#E2E8F0" strokeWidth="1" className="dark:stroke-slate-755" />

                {/* Data points references & lines */}
                {/* Revenue (Tháng 4: 100M, Tháng 5: 920M, Tháng 6: 1200M) */}
                <path 
                  d="M 50 170 Q 150 120 250 80 T 450 40" 
                  fill="none" 
                  stroke="#DC2626" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
                <circle cx="50" cy="170" r="5" fill="#DC2626" />
                <circle cx="250" cy="80" r="5" fill="#DC2626" />
                <circle cx="450" cy="40" r="5" fill="#DC2626" />

                {/* Expense (Tháng 4: 40M, Tháng 5: 220M, Tháng 6: 350M) */}
                <path 
                  d="M 50 180 Q 150 150 250 130 T 450 110" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
                <circle cx="50" cy="180" r="4.5" fill="#10B981" />
                <circle cx="250" cy="130" r="4.5" fill="#10B981" />
                <circle cx="450" cy="110" r="4.5" fill="#10B981" />

                {/* Profit (Tháng 4: 60M, Tháng 5: 700M, Tháng 6: 850M) */}
                <path 
                  d="M 50 185 Q 150 160 250 110 T 450 70" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
                <circle cx="50" cy="185" r="4.5" fill="#3B82F6" />
                <circle cx="250" cy="110" r="4.5" fill="#3B82F6" />
                <circle cx="450" cy="70" r="4.5" fill="#3B82F6" />

                {/* Text labels axis */}
                <text x="50" y="195" fill="#94A3B8" fontSize="10" fontWeight="bold">T4/2026</text>
                <text x="250" y="195" fill="#94A3B8" fontSize="10" fontWeight="bold">T5/2026</text>
                <text x="450" y="195" fill="#94A3B8" fontSize="10" fontWeight="bold">T6/2026</text>

                {/* Cash volume labels */}
                <text x="15" y="25" fill="#94A3B8" fontSize="9">1.5 B</text>
                <text x="15" y="75" fill="#94A3B8" fontSize="9">1.0 B</text>
                <text x="15" y="125" fill="#94A3B8" fontSize="9">500 M</text>
                <text x="15" y="175" fill="#94A3B8" fontSize="9">0 M</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Project progress distribution pie chart or bar list */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trạng thái phát triển</h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-550 block mt-0.5">Mật độ phân bổ dự án xây dựng</span>
          </div>

          <div className="space-y-4 my-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-blue-600 dark:text-blue-400">Chuẩn bị hồ sơ (1)</span>
                <span className="text-slate-700 dark:text-slate-300">33.3%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: "33.3%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-emerald-500 dark:text-emerald-400">Đang thi công thực địa (1)</span>
                <span className="text-slate-700 dark:text-slate-300">33.3%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: "33.3%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-slate-400 dark:text-slate-500">Hoàn thành & bàn giao (1)</span>
                <span className="text-slate-700 dark:text-slate-300">33.3%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-slate-400 dark:bg-slate-500 h-full" style={{ width: "33.3%" }} />
              </div>
            </div>
          </div>

          <button 
            onClick={() => setTab("projects")}
            className="w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mt-2 group border border-slate-150 dark:border-slate-700"
          >
            Quản lý công trình <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

      </div>

      {/* Bento Grid layout of warnings, low resources, and reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today scheduler Tasks */}
        <div className="p-6 bg-slate-900 dark:bg-slate-950 rounded-3xl text-white shadow-sm col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Công việc hôm nay
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-350 px-2.5 py-1 rounded-md font-extrabold border border-slate-700">60 NGÀY</span>
            </div>

            <div className="space-y-2.5">
              {todayTasks.map((t) => (
                <div key={t.id} className="p-3 bg-slate-800/40 dark:bg-slate-900/40 rounded-xl border border-slate-800 text-white flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      defaultChecked={t.done} 
                      className="mt-1 rounded text-red-600 focus:ring-red-500 bg-slate-700 border-slate-600 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className={`text-xs block font-medium ${t.done ? "line-through text-slate-400" : "text-white"}`}>
                        {t.text}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{t.assignee}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low materials warning list - High Impact Solid Red Alert Card */}
        <div className="p-6 bg-red-600 dark:bg-red-700 rounded-3xl text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white animate-bounce" /> Vật tư sắp hết
              </h3>
              <span className="text-[9px] text-white/90 bg-white/20 px-2 py-0.5 rounded font-bold uppercase">Khẩn</span>
            </div>

            {lowMaterials.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/80">Tồn kho toàn bộ vật tư ổn định.</div>
            ) : (
              <div className="space-y-3">
                {lowMaterials.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 text-white backdrop-blur-md">
                    <div className="text-xs font-bold flex justify-between">
                      <span className="line-clamp-1">{m.name}</span>
                      <span className="underline shrink-0 select-none ml-1">{m.stock} {m.unit}</span>
                    </div>
                    <div className="text-[10px] text-white/70 mt-1 flex justify-between">
                      <span>Mức khuyên tối thiểu:</span>
                      <span className="font-semibold">{m.minStock} {m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setTab("materials")}
            className="w-full text-center text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl mt-4 border border-white/10 transition-colors"
          >
            Nhập xưởng vật tư ngay
          </button>
        </div>

        {/* Payoffs reminder */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4.5 h-4.5 text-emerald-500" /> Nhắc nợ thanh toán
              </h3>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">Không có hóa đơn đến hạn.</div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((p, index) => (
                  <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-150 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.clientName}
                    </div>
                    <div className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 flex justify-between">
                      <span className="truncate max-w-[125px]">{p.milestone}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{(p.amount / 1000000).toFixed(1)}Mđ</span>
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-550 mt-0.5 flex justify-between font-mono">
                      <span>Hạn: {p.dueDate}</span>
                      <span>HD: {p.contractNo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setTab("contracts")}
            className="w-full text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-4 leading-none animate-pulse"
          >
            Theo dõi công nợ hợp đồng
          </button>
        </div>

      </div>

      {/* Upcoming handovers & Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Handover List */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-705 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              📅 Công trình sắp bàn giao (60 ngày tới)
            </h3>
            
            {upcomingHandovers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">Không có công trình nào sắp bàn giao.</div>
            ) : (
              <div className="space-y-3.5">
                {upcomingHandovers.map((p) => (
                  <div key={p.id} className="p-3 bg-red-50/50 dark:bg-red-955/10 border border-red-100 dark:border-red-950/20 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{p.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-450 block mt-0.5">Địa chỉ: {p.address}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-1.5 py-0.5 bg-rose-105 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded text-[9px] font-extrabold uppercase tracking-wide">
                        Chỉ còn {p.daysLeft} ngày
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">Dự kiến: {p.endDateExpected}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications & Log system alerts */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-705 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BellRing className="w-4.5 h-4.5 text-red-550 text-red-500" /> Hệ thống báo động & Nhật ký thông tin (Real-time logs)
          </h3>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {notifications.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-150 dark:border-slate-700 select-all hover:bg-slate-100/50 dark:hover:bg-slate-700/80 transition-colors">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                    log.type === 'delay' 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-955 dark:text-rose-300' 
                      : log.type === 'low_stock' 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-955 dark:text-blue-300'
                  }`}>
                    {log.type === 'delay' ? 'Trễ tiến độ' : log.type === 'low_stock' ? 'Hết vật tư' : 'Thanh toán'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(log.sentAt).toLocaleString("vi-VN")}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1.5">{log.message}</p>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center justify-between">
                  <span>Kênh: {log.channels.join(", ")}</span>
                  <span className="text-emerald-500 font-bold">Đã gửi tự động ●</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
