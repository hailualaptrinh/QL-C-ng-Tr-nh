/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { getStoredUser, clearAuthToken, api, getAuthToken } from "./api";
import { 
  ConstructionProject, 
  Client, 
  DailyDiary, 
  Staff, 
  Material, 
  StockTransaction, 
  CashTransaction, 
  Contract, 
  NotificationLog 
} from "./types";

// Component imports
import Auth from "./components/Auth";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Clients from "./components/Clients";
import Projects from "./components/Projects";
import Timeline from "./components/Timeline";
import Diary from "./components/Diary";
import StaffPanel from "./components/Staff";
import Materials from "./components/Materials";
import Finance from "./components/Finance";
import Contracts from "./components/Contracts";
import Reports from "./components/Reports";
import AuditPanel from "./components/AuditPanel";

import { Loader2, RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(getStoredUser());
  const [tab, setTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Global system database lists
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [diaries, setDiaries] = useState<DailyDiary[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // Selection states for jumps or timeline details
  const [selectedProjectIdForTimeline, setSelectedProjectIdForTimeline] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Sync dark theme mode to documentElement style
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle logout
  const handleLogout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setTab("dashboard");
  }, []);

  // Listen to implicit authentication expiry events from api.ts fetch wrapper
  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout();
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [handleLogout]);

  // Fetch all database records from Express API
  const refreshAllData = async (isSilent = false) => {
    const token = getAuthToken();
    if (!token || !user) return;

    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [
        projsData,
        clientsData,
        diariesData,
        staffData,
        matsData,
        stockTxData,
        cashTxData,
        contractsData,
        notifsData
      ] = await Promise.all([
        api.getProjects(),
        api.getClients(),
        api.getDiaries(),
        api.getStaff(),
        api.getMaterials(),
        api.getStockTransactions(),
        api.getCashTransactions(),
        api.getContracts(),
        api.getNotifications()
      ]);

      setProjects(projsData || []);
      setClients(clientsData || []);
      setDiaries(diariesData || []);
      setStaff(staffData || []);
      setMaterials(matsData || []);
      setStockTransactions(stockTxData || []);
      setCashTransactions(cashTxData || []);
      setContracts(contractsData || []);
      setNotifications(notifsData || []);
    } catch (err) {
      console.error("Lỗi trích xuất hồ sơ dữ liệu tổng:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Run initial fetch on mount/auth change
  useEffect(() => {
    if (user) {
      refreshAllData();
      // Verify token is still good
      api.getMe().catch(() => {
        handleLogout();
      });
    }
  }, [user]);

  const handleLoginSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
  };

  // Render loading splash screen during main retrieval
  if (user && loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 animate-pulse">
          Thiết lập cấu hình và đồng bộ hồ sơ Panel Hạnh Phúc Việt...
        </p>
      </div>
    );
  }

  // Render auth module if user not logged in
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors flex flex-col lg:flex-row">
      
      {/* Sidebar Navigation */}
      <Navigation
        currentTab={tab}
        setTab={setTab}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notificationsCount={notifications.length}
      />

      {/* Main Panel Area */}
      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 w-full max-w-7xl mx-auto overflow-hidden">
        
        {/* Floating live sync state badge */}
        <div className="flex justify-end mb-4 antialiased">
          <button
            onClick={() => refreshAllData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            title="Đồng bộ lại tức thời"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "ĐANG TẢI..." : "ĐỒNG BỘ NÓNG"}</span>
          </button>
        </div>

        {/* Tab Router Switcher Container */}
        <div className="animate-in fade-in duration-200">
          
          {tab === "dashboard" && (
            <Dashboard
              projects={projects}
              materials={materials}
              transactions={cashTransactions}
              contracts={contracts}
              notifications={notifications}
              user={user}
              setTab={setTab}
            />
          )}

          {tab === "clients" && (
            <Clients
              clients={clients}
              user={user}
              onRefresh={refreshAllData}
            />
          )}

          {tab === "projects" && (
            <Projects
              projects={projects}
              clients={clients}
              user={user}
              onRefresh={refreshAllData}
              setTab={setTab}
              setSelectedProjectIdForTimeline={setSelectedProjectIdForTimeline}
            />
          )}

          {tab === "timeline" && (
            <Timeline
              projects={projects}
              user={user}
              onRefresh={refreshAllData}
              selectedProjectId={selectedProjectIdForTimeline}
              setSelectedProjectId={setSelectedProjectIdForTimeline}
            />
          )}

          {tab === "diary" && (
            <Diary
              diaries={diaries}
              projects={projects}
              user={user}
              onRefresh={refreshAllData}
            />
          )}

          {tab === "staff" && (
            <StaffPanel
              staff={staff}
              projects={projects}
              user={user}
              onRefresh={refreshAllData}
            />
          )}

          {tab === "materials" && (
            <Materials
              materials={materials}
              stockTransactions={stockTransactions}
              user={user}
              onRefresh={refreshAllData}
            />
          )}

          {tab === "finance" && (
            <Finance
              transactions={cashTransactions}
              projects={projects}
              user={user}
              onRefresh={refreshAllData}
            />
          )}

          {tab === "contracts" && (
            <Contracts
              contracts={contracts}
              clients={clients}
              user={user}
              onRefresh={refreshAllData}
            />
          )}

          {tab === "reports" && (
            <Reports
              transactions={cashTransactions}
              projects={projects}
              materials={materials}
            />
          )}

          {tab === "audit" && (
            <AuditPanel
              user={user}
              onRefresh={refreshAllData}
            />
          )}

        </div>

      </main>

    </div>
  );
}
