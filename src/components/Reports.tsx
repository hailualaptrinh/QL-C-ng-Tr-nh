/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { CashTransaction, ConstructionProject, Material, Client } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  Briefcase, 
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Calendar
} from "lucide-react";

interface ReportsProps {
  transactions: CashTransaction[];
  projects: ConstructionProject[];
  materials: Material[];
}

export default function Reports({ transactions, projects, materials }: ReportsProps) {
  const [reportType, setReportType] = useState<'financial' | 'materials' | 'projects'>('financial');

  // Compute aggregated reports
  const aggregations = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let materialCost = 0;
    let laborCost = 0;
    let machineCost = 0;
    let otherCost = 0;

    transactions.forEach(t => {
      if (t.type === 'thu') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (t.category === 'material') materialCost += t.amount;
        else if (t.category === 'labor') laborCost += t.amount;
        else if (t.category === 'machinery') machineCost += t.amount;
        else otherCost += t.amount;
      }
    });

    const profit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      profit,
      profitMargin,
      materialCost,
      laborCost,
      machineCost,
      otherCost
    };
  }, [transactions]);

  // Handle spreadsheet export
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "\uFEFF"; // BOM prefix for Vietnamese fonts
    
    if (reportType === 'financial') {
      csvContent += "BÁO CÁO THU CHI TÀI CHÍNH HẠNH PHÚC VIỆT\n";
      csvContent += "Chỉ mục,Loại giao dịch,Hạng mục,Số tiền (đ),Ngày ghi nhận,Nội dung\n";
      transactions.forEach((t, i) => {
        csvContent += `"${i+1}","${t.type === 'thu' ? 'THU' : 'CHI'}","${t.category}","${t.amount}","${t.date}","${t.notes || ''}"\n`;
      });
    } else if (reportType === 'materials') {
      csvContent += "BÁO CÁO TỒN KHO VẬT TƯ CHUYÊN BIỆT\n";
      csvContent += "Mã định dạng,Tên vật phẩm,Nhóm danh mục,Đơn vị,Tồn kho thực tế,Đơn giá bán sỉ\n";
      materials.forEach(m => {
        csvContent += `"${m.code}","${m.name}","${m.category}","${m.unit}","${m.stock}","${m.exportPrice}"\n`;
      });
    } else {
      csvContent += "BÁO CÁO TIẾN ĐỘ THI CÔNG CÁC CÔNG TRÌNH\n";
      csvContent += "Mã công trình,Tên công trình,Chủ đầu tư,Địa bàn,Giá trị hợp đồng,Trạng thái\n";
      projects.forEach(p => {
        csvContent += `"${p.code}","${p.name}","${p.ownerName}","${p.address}","${p.contractValue}","${p.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BAO_CAO_${reportType.toUpperCase()}_HANH_PHUC_VIET.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Upper action area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" /> TRUNG TÂM BÁO CÁO & XUẤT DỮ LIỆU
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-405 mt-1">Xuất sổ quỹ tài chính, thống kê thiết kế lắp đặt vách panel EPS</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="px-3 py-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất file Excel (.csv)</span>
          </button>
        </div>
      </div>

      {/* Tabs list selecting reports scope */}
      <div className="flex border-b border-slate-100 dark:border-slate-700 gap-1.5 text-xs">
        <button
          onClick={() => setReportType('financial')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            reportType === 'financial'
              ? "border-rose-500 text-rose-600 dark:text-rose-405"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Doanh Số & Tài Chính
        </button>

        <button
          onClick={() => setReportType('materials')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            reportType === 'materials'
              ? "border-rose-500 text-rose-600 dark:text-rose-405"
              : "border-transparent text-slate-400 hover:text-slate-605"
          }`}
        >
          Sản lượng tồn kho Vật Tư
        </button>

        <button
          onClick={() => setReportType('projects')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            reportType === 'projects'
              ? "border-rose-500 text-rose-600 dark:text-rose-450"
              : "border-transparent text-slate-400 hover:text-slate-605"
          }`}
        >
          Hồ Sơ & Tiến Độ Công Trình
        </button>
      </div>

      {/* Financial analytical overview rendering */}
      {reportType === "financial" && (
        <div className="space-y-6">
          
          {/* Grouped metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tổng Doanh Thu</span>
              <span className="text-base font-mono font-black text-rose-600 dark:text-rose-455 mt-1 block">
                {aggregations.totalIncome.toLocaleString()}đ
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tổng Chi Phí</span>
              <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-450 mt-1 block">
                {aggregations.totalExpense.toLocaleString()}đ
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Lợi Nhuận ròng</span>
              <span className="text-base font-mono font-black text-blue-500 mt-1 block">
                {aggregations.profit.toLocaleString()}đ
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tỷ Lệ Sinh Lời</span>
              <span className="text-base font-mono font-black text-purple-600 dark:text-purple-400 mt-1 block">
                {aggregations.profitMargin}%
              </span>
            </div>
          </div>

          {/* Costs grouping breakdown and graphical bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Visual categories breakdown table */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-widest pl-1">
                Chi tiết tỷ trọng chi phí
              </h3>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Vật tư vách panel & thép ({aggregations.materialCost.toLocaleString()}đ)</span>
                    <span className="text-slate-450">
                      {aggregations.totalExpense > 0 ? Math.round((aggregations.materialCost / aggregations.totalExpense) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${aggregations.totalExpense > 0 ? (aggregations.materialCost / aggregations.totalExpense) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Nhân công chi tiền thợ lắp ráp ({aggregations.laborCost.toLocaleString()}đ)</span>
                    <span className="text-slate-455">
                      {aggregations.totalExpense > 0 ? Math.round((aggregations.laborCost / aggregations.totalExpense) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${aggregations.totalExpense > 0 ? (aggregations.laborCost / aggregations.totalExpense) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Thuê xe cẩu thi công lắp ráp ({aggregations.machineCost.toLocaleString()}đ)</span>
                    <span className="text-slate-455">
                      {aggregations.totalExpense > 0 ? Math.round((aggregations.machineCost / aggregations.totalExpense) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${aggregations.totalExpense > 0 ? (aggregations.machineCost / aggregations.totalExpense) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Hành chính & Khác ({aggregations.otherCost.toLocaleString()}đ)</span>
                    <span className="text-slate-455">
                      {aggregations.totalExpense > 0 ? Math.round((aggregations.otherCost / aggregations.totalExpense) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-705 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${aggregations.totalExpense > 0 ? (aggregations.otherCost / aggregations.totalExpense) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

            </div>

            {/* Incomes stats text box */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest pl-1 mb-3">
                  Xác thực thanh toán lộ trình
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Doanh số của Hạnh Phúc Việt giai đoạn này đạt tỷ suất sinh lợi trung bình lý tưởng đạt <b>{aggregations.profitMargin}%</b>. Hệ thống khuyến nghị tiếp tục đốc thúc thu hồi công nợ các đợt thi công vách ngăn biệt thự vòm nhằm đảm bảo dòng tiền lành mạnh.
                </p>
              </div>

              <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-755 border border-slate-100 dark:border-slate-705 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Tổng tiền mặt ròng trong két</span>
                  <span className="text-sm font-black text-rose-600 font-mono block mt-1">{(aggregations.profit).toLocaleString()}đ</span>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Materials catalog inventory reporting */}
      {reportType === "materials" && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-rose-100 dark:border-slate-705 text-slate-400 font-bold text-[10px] uppercase">
                <th className="px-5 py-3">Mã định nghĩa</th>
                <th className="px-5 py-3">Tên vật tư</th>
                <th className="px-5 py-3">Bộ nhóm</th>
                <th className="px-5 py-3 text-right">Giá tiền mua</th>
                <th className="px-5 py-3 text-right">Giá tiền bán</th>
                <th className="px-5 py-3 text-center">Tồn kho khả dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705">
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="px-5 py-3 font-mono font-bold text-rose-500 dark:text-rose-450">{m.code}</td>
                  <td className="px-5 py-3 font-bold text-slate-850 dark:text-white">{m.name}</td>
                  <td className="px-5 py-3 uppercase text-[10px] text-slate-400 font-bold">{m.category}</td>
                  <td className="px-5 py-3 text-right font-mono">{m.importPrice.toLocaleString()}đ</td>
                  <td className="px-5 py-3 text-right font-mono text-emerald-600 dark:text-emerald-450 font-bold">{m.exportPrice.toLocaleString()}đ</td>
                  <td className="px-5 py-3 text-center font-mono font-bold text-slate-850 dark:text-slate-100">{m.stock} {m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects portfolio progress listing report */}
      {reportType === "projects" && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-705 text-slate-400 font-bold text-[10px] uppercase">
                <th className="px-5 py-3">Mã CT</th>
                <th className="px-5 py-3">Tên công trình dự án</th>
                <th className="px-5 py-3">Chủ đầu tư liên kết</th>
                <th className="px-5 py-3">Địa điểm bàn giao</th>
                <th className="px-5 py-3 text-right">Trị giá HĐ</th>
                <th className="px-5 py-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-705">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-700/20">
                  <td className="px-5 py-3 font-mono font-bold text-rose-500 dark:text-rose-455">{p.code}</td>
                  <td className="px-5 py-3 font-bold text-slate-855 dark:text-white capitalize">{p.name}</td>
                  <td className="px-5 py-3">{p.ownerName}</td>
                  <td className="px-5 py-3 text-slate-450 max-w-[200px] truncate" title={p.address}>{p.address}</td>
                  <td className="px-5 py-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-450">
                    {p.contractValue.toLocaleString()}đ
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-700 uppercase">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
