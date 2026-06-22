/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Material, MaterialCategory, StockTransaction, UserRole } from "../types";
import { api } from "../api";
import { 
  Package, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale, 
  AlertTriangle, 
  Layers, 
  FileSpreadsheet, 
  Loader2, 
  X,
  PlusCircle,
  FolderOpen
} from "lucide-react";

interface MaterialsProps {
  materials: Material[];
  stockTransactions: StockTransaction[];
  user: any;
  onRefresh: () => void;
}

export default function Materials({
  materials,
  stockTransactions,
  user,
  onRefresh
}: MaterialsProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Form states
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);

  // Material item creation form states
  const [matName, setMatName] = useState("");
  const [matCategory, setMatCategory] = useState<MaterialCategory>(MaterialCategory.PANEL);
  const [matUnit, setMatUnit] = useState("m2");
  const [importPrice, setImportPrice] = useState("");
  const [exportPrice, setExportPrice] = useState("");
  const [minStock, setMinStock] = useState("");

  // Transaction form states
  const [selMaterialId, setSelMaterialId] = useState("");
  const [txType, setTxType] = useState<'import' | 'export' | 'audit'>('import');
  const [txQty, setTxQty] = useState("");
  const [actualQty, setActualQty] = useState("");
  const [txNotes, setTxNotes] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authorization checks
  const isAuthorizedToEdit = [UserRole.ADMIN, UserRole.KHO, UserRole.PM].includes(user.role as UserRole);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "ALL" || m.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [materials, search, selectedCategory]);

  const stats = useMemo(() => {
    const totalCount = materials.length;
    const alertCount = materials.filter(m => m.stock < m.minStock).length;
    return { totalCount, alertCount };
  }, [materials]);

  const openCatalogModal = () => {
    setMatName("");
    setMatCategory(MaterialCategory.PANEL);
    setMatUnit("m2");
    setImportPrice("");
    setExportPrice("");
    setMinStock("10");
    setErrorMsg(null);
    setCatalogModalOpen(true);
  };

  const openTransactionModal = (materialId?: string, forceType?: 'import' | 'export' | 'audit') => {
    setSelMaterialId(materialId || materials[0]?.id || "");
    setTxType(forceType || 'import');
    setTxQty("");
    setActualQty("");
    setTxNotes("");
    setErrorMsg(null);
    setTransactionModalOpen(true);
  };

  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName || !importPrice || !exportPrice) {
      setErrorMsg("Vui lòng nhập đầy đủ tên, giá nhập và giá xuất.");
      return;
    }

    setFormLoading(true);
    try {
      await api.createMaterial({
        name: matName,
        category: matCategory,
        unit: matUnit,
        importPrice: Number(importPrice),
        exportPrice: Number(exportPrice),
        minStock: Number(minStock) || 10
      });
      setCatalogModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tạo vật tư mới.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selMaterialId || !txQty) {
      setErrorMsg("Vui lòng cung cấp mã vật tư và số lượng giao dịch.");
      return;
    }

    setFormLoading(true);
    try {
      await api.createStockTransaction({
        materialId: selMaterialId,
        type: txType,
        quantity: Number(txQty),
        actualQuantity: txType === 'audit' ? Number(actualQty) : undefined,
        notes: txNotes
      });
      setTransactionModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Cập nhật lỗi.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-500" /> QUẢN LÝ VẬT TƯ & TỒN KHO HẠNH PHÚC VIỆT
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Xuất nhập định vị Panel EPS chống cháy, thép mạ kẽm và hồ sơ tồn kho chuẩn mực</p>
        </div>

        {isAuthorizedToEdit && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => openTransactionModal(undefined, "import")}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Nhập / Xuất Kho</span>
            </button>

            <button
              onClick={openCatalogModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng Ký Vật Tư</span>
            </button>
          </div>
        )}
      </div>

      {/* Tickers section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search tool block */}
        <div className="col-span-1 md:col-span-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-705 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm vật tư theo mã định dạng hoặc tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm bg-transparent border-none outline-none dark:text-white"
          />
        </div>

        {/* Category filtering dropdown list */}
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-705 shadow-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-450" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs font-bold bg-transparent border-none outline-none dark:text-white"
          >
            <option value="ALL">Tất cả Nhóm Vật Tư</option>
            {Object.values(MaterialCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main warehouse views */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left main side: Materials catalogs list */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-805 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-705 text-slate-404 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Mã vật tư</th>
                  <th className="px-5 py-3.5">Tên vật phẩm</th>
                  <th className="px-5 py-3.5">Đơn vị</th>
                  <th className="px-5 py-3.5">Đơn giá Nhập</th>
                  <th className="px-5 py-3.5">Đơn giá Xuất</th>
                  <th className="px-5 py-3.5">Mức Tồn</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-705 text-xs">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">Không tìm thấy vật phẩm vật tư nào.</td>
                  </tr>
                ) : (
                  filteredMaterials.map((m) => {
                    const isLow = m.stock < m.minStock;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-rose-500 dark:text-rose-450">{m.code}</td>
                        <td className="px-5 py-4">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block uppercase tracking-wider mt-0.5">{m.category}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-500">{m.unit}</td>
                        <td className="px-5 py-4 font-mono font-bold">{m.importPrice.toLocaleString()}đ</td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-450">{m.exportPrice.toLocaleString()}đ</td>
                        
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold font-mono">
                            <span className={isLow ? "text-red-500" : "text-slate-850 dark:text-slate-200"}>{m.stock}</span>
                            {isLow && (
                              <span className="px-1.5 py-0.5 bg-yellow-101 bg-red-50 dark:bg-red-950 text-red-650 dark:text-red-400 text-[8px] font-bold rounded flex items-center gap-0.5 uppercase tracking-wide">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-500" /> yếu
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end items-center gap-1 shrink-0">
                            <button
                              onClick={() => openTransactionModal(m.id, "import")}
                              className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-200 rounded text-[10px] uppercase font-bold"
                            >
                              Nhập
                            </button>
                            <button
                              onClick={() => openTransactionModal(m.id, "export")}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/25 dark:hover:bg-rose-950/45 text-rose-650 dark:text-rose-400 rounded text-[10px] uppercase font-bold"
                            >
                              Xuất
                            </button>
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

        {/* Right side: Real-time warehouse ledger log */}
        <div className="xl:col-span-1 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-slate-400" /> Nhật ký Xuất/Nhập/Kiểm kê kho
            </h3>

            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {stockTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-10">Chưa có giao dịch kho nào được ghi nhận.</p>
              ) : (
                stockTransactions.map((tx) => {
                  let badge = "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-350";
                  let icon = <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />;
                  if (tx.type === "export") {
                    badge = "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-350";
                    icon = <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 mt-0.5" />;
                  } else if (tx.type === "audit") {
                    badge = "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-350";
                    icon = <Scale className="w-3.5 h-3.5 text-blue-500 mt-0.5" />;
                  }

                  return (
                    <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-705/35 border border-slate-100 dark:border-slate-700 rounded-xl flex items-start gap-2.5">
                      {icon}
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${badge}`}>
                            {tx.type === 'import' ? 'Nhập' : tx.type === 'export' ? 'Xuất' : 'Kiểm kê'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(tx.date).toLocaleDateString("vi-VN")}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white capitalize line-clamp-1">{tx.materialName}</h4>
                        <div className="text-[10px] text-slate-505 dark:text-slate-400 flex justify-between">
                          <span>Số lượng giao tác:</span>
                          <span className="font-bold">{tx.quantity} pcs</span>
                        </div>
                        {tx.notes && <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate">{tx.notes}</p>}
                        <div className="text-[8px] text-slate-400 mt-0.5">Tiến hành bởi: {tx.performedBy}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Catalog Item Creation Modal */}
      {catalogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-705 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Đăng ký loại vật tư danh mục mới
              </h3>
              <button onClick={() => setCatalogModalOpen(false)} className="text-slate-405 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCatalog} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg">{errorMsg}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Tên gọi sản phẩm vật tư *</label>
                  <input
                    type="text"
                    required
                    value={matName}
                    onChange={(e) => setMatName(e.target.value)}
                    placeholder="Tường vách Panel EPS dày 75mm cách âm"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Nhóm phân loại *</label>
                    <select
                      value={matCategory}
                      onChange={(e) => setMatCategory(e.target.value as MaterialCategory)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none"
                    >
                      {Object.values(MaterialCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Đơn vị đo lường *</label>
                    <input
                      type="text"
                      required
                      value={matUnit}
                      onChange={(e) => setMatUnit(e.target.value)}
                      placeholder="m2, Cây, Bao, m3..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Đơn giá tiền Nhập *</label>
                    <input
                      type="number"
                      required
                      value={importPrice}
                      onChange={(e) => setImportPrice(e.target.value)}
                      placeholder="250000"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Đơn giá tiền Xuất *</label>
                    <input
                      type="number"
                      required
                      value={exportPrice}
                      onChange={(e) => setExportPrice(e.target.value)}
                      placeholder="320000"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">Hạn mức tồn kho cảnh báo tối thiểu *</label>
                  <input
                    type="number"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCatalogModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ghi Nhận Loại Sản Phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse Transaction Creation Modal */}
      {transactionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-755 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-905 dark:text-white uppercase tracking-wide">
                Phiếu Xuất / Nhập / Kiểm kê kho
              </h3>
              <button onClick={() => setTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 bg-red-100 text-red-750 text-xs rounded-lg">{errorMsg}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Lựa chọn vật phẩm kho *</label>
                  <select
                    value={selMaterialId}
                    onChange={(e) => setSelMaterialId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-805 dark:text-white focus:outline-none animate-in"
                  >
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.code} - {m.name} (Hữu dụng: {m.stock} {m.unit})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Dạng giao dịch *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxType("import")}
                      className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                        txType === "import"
                          ? "border-emerald-505 bg-emerald-50/50 dark:bg-emerald-950/25 text-emerald-805"
                          : "border-slate-250 hover:border-slate-350"
                      }`}
                    >
                      Nhập vào kho
                    </button>

                    <button
                      type="button"
                      onClick={() => setTxType("export")}
                      className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                        txType === "export"
                          ? "border-rose-505 bg-rose-50/50 dark:bg-rose-950/25 text-rose-805"
                          : "border-slate-250 hover:border-slate-350"
                      }`}
                    >
                      Xuất chuyển đi
                    </button>

                    <button
                      type="button"
                      onClick={() => setTxType("audit")}
                      className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                        txType === "audit"
                          ? "border-blue-505 bg-blue-50/50 dark:bg-blue-950/25 text-blue-805"
                          : "border-slate-250 hover:border-slate-350"
                      }`}
                    >
                      Kiểm đếm kho
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">
                    {txType === 'audit' ? 'Chênh lệch sổ lượng / Diễn biến lượng hao hụt' : 'Số lượng tác động thủ kho *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={txQty}
                    onChange={(e) => setTxQty(e.target.value)}
                    placeholder="Nhập số lượng..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none"
                  />
                </div>

                {txType === "audit" && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Số lượng kiểm kê tồn kho thực tế ở hiện trường *</label>
                    <input
                      type="number"
                      required
                      value={actualQty}
                      onChange={(e) => setActualQty(e.target.value)}
                      placeholder="Số lượng thực đếm..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Nội dung giải trình / Lý do hành động</label>
                  <input
                    type="text"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="Xuất xưởng bàn giao thợ cơ khí bắt kèo sắt CT001..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Duyệt Giao Dịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
