/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Clock, 
  BookOpen, 
  Briefcase, 
  Package, 
  Wallet, 
  FileText, 
  TrendingUp, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X 
} from "lucide-react";
import { UserRole } from "../types";

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: any;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notificationsCount: number;
}

export default function Navigation({
  currentTab,
  setTab,
  user,
  darkMode,
  setDarkMode,
  onLogout,
  sidebarOpen,
  setSidebarOpen,
  notificationsCount
}: NavigationProps) {

  // Navigation Items defined with authorization limits
  const allNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: Object.values(UserRole) },
    { id: "clients", label: "Khách Hàng", icon: Users, roles: [UserRole.ADMIN, UserRole.GIAM_DOC, UserRole.PM, UserRole.KE_TOAN] },
    { id: "projects", label: "Công Trình", icon: Building2, roles: Object.values(UserRole) },
    { id: "timeline", label: "Tiến Độ", icon: Clock, roles: Object.values(UserRole) },
    { id: "diary", label: "Nhật Ký Thi Công", icon: BookOpen, roles: Object.values(UserRole) },
    { id: "staff", label: "Nhân Sự", icon: Briefcase, roles: Object.values(UserRole) },
    { id: "materials", label: "Vật Tư & Kho", icon: Package, roles: [UserRole.ADMIN, UserRole.GIAM_DOC, UserRole.PM, UserRole.KHO] },
    { id: "finance", label: "Thu Chi Tài Chính", icon: Wallet, roles: [UserRole.ADMIN, UserRole.GIAM_DOC, UserRole.KE_TOAN] },
    { id: "contracts", label: "Hợp Đồng", icon: FileText, roles: [UserRole.ADMIN, UserRole.GIAM_DOC, UserRole.PM, UserRole.KE_TOAN] },
    { id: "reports", label: "Báo Cáo", icon: TrendingUp, roles: [UserRole.ADMIN, UserRole.GIAM_DOC, UserRole.KE_TOAN, UserRole.PM] },
    { id: "audit", label: "Hệ Thống & Tải về", icon: ShieldCheck, roles: [UserRole.ADMIN] },
  ];

  // Filter items matching user's role
  const allowedNavItems = allNavItems.filter(item => item.roles.includes(user.role as UserRole));

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="lg:hidden h-16 w-full fixed top-0 flex items-center justify-between px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg tracking-tight">Hạnh Phúc Việt</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme custom Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setTab("dashboard")} 
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Bell className="w-5 h-5" />
              {notificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {notificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      {/* Left Sidebar Layout */}
      <aside
        className={`fixed inset-y-0 left-0 lg:sticky lg:sticky-top w-64 md:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-transform transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } z-40 shadow-lg lg:shadow-none h-screen`}
      >
        {/* Upper Brand Section */}
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">H</div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-base leading-tight text-slate-900 dark:text-white">Hạnh Phúc Việt</span>
              <span className="text-[10px] uppercase tracking-wider text-green-600 dark:text-green-450 font-semibold">Quản lý Công Trình</span>
            </div>
          </div>
          
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] text-left">
            {allowedNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setSidebarOpen(false); // Close mobile drawer when selection is clicked
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  }`}
                >
                  <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? "text-red-700 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Configurations & Buttons */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
          {/* Universal theme switcher */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">Chế độ</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition-all w-16"
            >
              <div className={`p-1 rounded-full ${!darkMode ? "bg-white text-amber-500 shadow-sm" : "bg-transparent text-slate-400"}`}>
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div className={`p-1 rounded-full ${darkMode ? "bg-slate-600 text-slate-200 shadow-sm" : "bg-transparent text-slate-400"}`}>
                <Moon className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* User info container at bottom */}
          <div className="p-3 bg-slate-900 dark:bg-slate-950 rounded-2xl text-white flex items-center gap-3 border border-slate-800 mt-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-xs font-semibold truncate text-white">{user.fullName || "Tài khoản"}</p>
              <p className="text-[9px] text-slate-400 tracking-wider font-semibold uppercase">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400"
              title="Đăng xuất"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
