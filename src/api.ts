/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple api wrapper to carry JWT headers and fetch data correctly
const API_URL = ""; // Relative path to Express server on same host/port

export function getAuthToken(): string | null {
  return localStorage.getItem("hanh_phuc_viet_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("hanh_phuc_viet_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("hanh_phuc_viet_token");
  localStorage.removeItem("hanh_phuc_viet_user");
}

export function getStoredUser() {
  const userJson = localStorage.getItem("hanh_phuc_viet_user");
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  localStorage.setItem("hanh_phuc_viet_user", JSON.stringify(user));
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Session expired, trigger signout on frontend implicitly
    clearAuthToken();
    window.dispatchEvent(new Event("auth-expired"));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Phiên đăng nhập hết hạn.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Có lỗi xảy ra trong quá trình xử lý.");
  }

  return response.json();
}

export const api = {
  // Auth API
  login: async (body: any) => {
    const data = await fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },
  getMe: () => fetchWithAuth("/api/auth/me"),

  // Users Management API
  getUsers: () => fetchWithAuth("/api/users"),
  createUser: (body: any) => fetchWithAuth("/api/users", { method: "POST", body: JSON.stringify(body) }),
  deleteUser: (id: string) => fetchWithAuth(`/api/users/${id}`, { method: "DELETE" }),

  // Clients API
  getClients: () => fetchWithAuth("/api/clients"),
  createClient: (body: any) => fetchWithAuth("/api/clients", { method: "POST", body: JSON.stringify(body) }),
  updateClient: (id: string, body: any) => fetchWithAuth(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteClient: (id: string) => fetchWithAuth(`/api/clients/${id}`, { method: "DELETE" }),

  // Projects API
  getProjects: () => fetchWithAuth("/api/projects"),
  createProject: (body: any) => fetchWithAuth("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  updateProject: (id: string, body: any) => fetchWithAuth(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProject: (id: string) => fetchWithAuth(`/api/projects/${id}`, { method: "DELETE" }),
  addDocument: (projectId: string, body: any) => fetchWithAuth(`/api/projects/${projectId}/documents`, { method: "POST", body: JSON.stringify(body) }),
  deleteDocument: (projectId: string, docId: string) => fetchWithAuth(`/api/projects/${projectId}/documents/${docId}`, { method: "DELETE" }),

  // Site Diary API
  getDiaries: () => fetchWithAuth("/api/diaries"),
  createDiary: (body: any) => fetchWithAuth("/api/diaries", { method: "POST", body: JSON.stringify(body) }),
  deleteDiary: (id: string) => fetchWithAuth(`/api/diaries/${id}`, { method: "DELETE" }),

  // Staff API
  getStaff: () => fetchWithAuth("/api/staff"),
  createStaff: (body: any) => fetchWithAuth("/api/staff", { method: "POST", body: JSON.stringify(body) }),
  updateStaff: (id: string, body: any) => fetchWithAuth(`/api/staff/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteStaff: (id: string) => fetchWithAuth(`/api/staff/${id}`, { method: "DELETE" }),
  addAttendance: (staffId: string, body: any) => fetchWithAuth(`/api/staff/${staffId}/attendance`, { method: "POST", body: JSON.stringify(body) }),

  // Materials API
  getMaterials: () => fetchWithAuth("/api/materials"),
  createMaterial: (body: any) => fetchWithAuth("/api/materials", { method: "POST", body: JSON.stringify(body) }),
  updateMaterial: (id: string, body: any) => fetchWithAuth(`/api/materials/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  createStockTransaction: (body: any) => fetchWithAuth("/api/materials/transactions", { method: "POST", body: JSON.stringify(body) }),
  getStockTransactions: () => fetchWithAuth("/api/materials/transactions"),

  // Cash Transactions API
  getCashTransactions: () => fetchWithAuth("/api/cash-transactions"),
  createCashTransaction: (body: any) => fetchWithAuth("/api/cash-transactions", { method: "POST", body: JSON.stringify(body) }),
  approveExpenses: () => fetchWithAuth("/api/cash-transactions/approve", { method: "POST" }),

  // Contracts API
  getContracts: () => fetchWithAuth("/api/contracts"),
  createContract: (body: any) => fetchWithAuth("/api/contracts", { method: "POST", body: JSON.stringify(body) }),
  updateMilestone: (contractId: string, milestoneIndex: number, body: { status: 'paid' | 'unpaid' }) => fetchWithAuth(`/api/contracts/${contractId}/milestones/${milestoneIndex}`, { method: "PUT", body: JSON.stringify(body) }),

  // Notifications API
  getNotifications: () => fetchWithAuth("/api/notifications"),
  dispatchNotification: (body: any) => fetchWithAuth("/api/notifications/dispatch", { method: "POST", body: JSON.stringify(body) }),

  // Logs & Backup API
  getAuditLogs: () => fetchWithAuth("/api/system/logs"),
  triggerBackup: () => fetchWithAuth("/api/system/backup", { method: "POST" }),
};
