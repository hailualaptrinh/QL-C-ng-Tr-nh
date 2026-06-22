/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "Admin",
  GIAM_DOC = "Giám Đốc",
  PM = "Quản Lý Dự Án",
  KE_TOAN = "Kế Toán",
  KHO = "Kho",
  KY_THUAT = "Kỹ Thuật",
  NHAN_CONG = "Nhân Công"
}

export enum ProjectStatus {
  CHUAN_BI = "Chuẩn bị",
  THI_CONG = "Thi công",
  TAM_DUNG = "Tạm dừng",
  HOAN_THANH = "Hoàn thành",
  BAO_HANH = "Bảo hành"
}

export enum MaterialCategory {
  PANEL = "Panel",
  SAT_THEP = "Sắt thép",
  XI_MANG = "Xi măng",
  CAT_DA = "Cát đá",
  DIEN_NUOC = "Điện nước",
  THIET_BI = "Thiết bị"
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  code: string; // Mã khách hàng
  fullName: string;
  phone: string;
  email: string;
  address: string;
  idCard: string; // CMND/CCCD
  notes?: string;
  createdAt: string;
}

export interface ConstructionPhase {
  name: string;
  percentage: number; // 0 - 100
  status: 'todo' | 'doing' | 'done';
  startDate?: string;
  endDate?: string;
}

export interface ConstructionProject {
  id: string;
  code: string; // Mã công trình
  name: string;
  ownerId: string; // Client ID
  ownerName: string; // Tên chủ đầu tư
  address: string;
  startDate: string;
  endDateExpected: string;
  contractValue: number;
  status: ProjectStatus;
  phases: ConstructionPhase[];
  documents: Array<{
    id: string;
    name: string;
    type: 'contract' | 'drawing' | 'document' | 'image';
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  createdAt: string;
}

export interface DailyDiary {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  updatedBy: string;
  tasksDone: string;
  workersCount: number;
  notes?: string;
  media: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
  }>;
  createdAt: string;
}

export interface Staff {
  id: string;
  code: string; // Mã nhân viên
  fullName: string;
  position: string; // Chức vụ
  department: string; // Phòng ban
  phone: string;
  currentProjectId?: string; // Điều động công trình
  attendance: Array<{
    date: string;
    status: 'present' | 'absent' | 'leave';
    overtimeHours: number;
    notes?: string;
  }>;
  createdAt: string;
}

export interface Material {
  id: string;
  code: string; // Mã vật tư
  name: string;
  category: MaterialCategory;
  unit: string; // Đơn vị tính
  importPrice: number;
  exportPrice: number;
  stock: number;
  minStock: number; // Cảnh báo tồn kho thấp
}

export interface StockTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: 'import' | 'export' | 'audit'; // Nhập - Xuất - Kiểm kê
  quantity: number;
  previousQuantity: number;
  actualQuantity?: number; // Cho kiểm kê
  date: string;
  performedBy: string;
  notes?: string;
}

export interface CashTransaction {
  id: string;
  type: 'thu' | 'chi';
  category: 'payment' | 'advance' | 'material' | 'labor' | 'machinery' | 'other';
  projectId?: string;
  projectName?: string;
  amount: number;
  date: string;
  performedBy: string;
  notes?: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  signedDate: string;
  value: number;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  fileUrl: string;
  fileName: string;
  paymentMilestones: Array<{
    milestone: string;
    percentage: number;
    amount: number;
    dueDate: string;
    status: 'paid' | 'unpaid';
  }>;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  type: 'delay' | 'low_stock' | 'payment_due' | 'contract_expiry' | 'system';
  message: string;
  sentAt: string;
  channels: string[]; // ['Email', 'SMS', 'Telegram']
  status: 'sent' | 'failed';
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  ip?: string;
  timestamp: string;
}
