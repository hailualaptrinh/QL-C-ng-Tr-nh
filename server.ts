import express from "express";
import path from "path";
import fs from "fs";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { 
  UserRole, 
  ProjectStatus, 
  MaterialCategory, 
  User, 
  Client, 
  ConstructionProject, 
  DailyDiary, 
  Staff, 
  Material, 
  StockTransaction, 
  CashTransaction, 
  Contract, 
  NotificationLog, 
  AuditLog 
} from "./src/types";

const PORT = 3000;
const JWT_SECRET = "hanh_phuc_viet_construction_jwt_secret_key_2026";
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper interface for database file configuration
interface DbSchema {
  users: User[];
  userPasswords: Record<string, string>; // userId -> hashed password
  clients: Client[];
  projects: ConstructionProject[];
  diaries: DailyDiary[];
  staff: Staff[];
  materials: Material[];
  stockTransactions: StockTransaction[];
  cashTransactions: CashTransaction[];
  contracts: Contract[];
  notifications: NotificationLog[];
  auditLogs: AuditLog[];
}

// Simple helper to log actions
function logAction(userId: string, username: string, action: string, db: DbSchema) {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    username,
    action,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog); // Prepend to show latest first
  // Max logs limit to avoid file bloat
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

// Load database file or seed it
function loadDb(): DbSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to parse db.json, recreating", e);
    }
  }

  // Pre-seed mock data in Vietnamese representing real Hanh Phuc Viet database
  const salt = bcryptjs.genSaltSync(10);
  const passwordAdmin = bcryptjs.hashSync("admin123", salt);
  const passwordGiamDoc = bcryptjs.hashSync("giamdoc123", salt);
  const passwordPM = bcryptjs.hashSync("pm123", salt);
  const passwordKeToan = bcryptjs.hashSync("ketoan123", salt);
  const passwordKho = bcryptjs.hashSync("kho123", salt);
  const passwordKyThuat = bcryptjs.hashSync("kythuat123", salt);
  const passwordNhanCong = bcryptjs.hashSync("nhancong123", salt);

  const initialUsers: User[] = [
    { id: "u-1", username: "admin", fullName: "Nguyễn Văn Hạnh", role: UserRole.ADMIN, phone: "0988.03.04.07", email: "admin@hanhphucviet.com", createdAt: new Date().toISOString() },
    { id: "u-2", username: "giamdoc", fullName: "Trần Thế Phúc", role: UserRole.GIAM_DOC, phone: "0911.222.333", email: "giamdoc@hanhphucviet.com", createdAt: new Date().toISOString() },
    { id: "u-3", username: "pm", fullName: "Phạm Minh Trí", role: UserRole.PM, phone: "0933.444.555", email: "pm.tri@hanhphucviet.com", createdAt: new Date().toISOString() },
    { id: "u-4", username: "ketoan", fullName: "Lê Thị Thảo", role: UserRole.KE_TOAN, phone: "0944.555.666", email: "ketoan@hanhphucviet.com", createdAt: new Date().toISOString() },
    { id: "u-5", username: "kho", fullName: "Hoàng Văn Khoa", role: UserRole.KHO, phone: "0955.666.777", email: "kho@hanhphucviet.com", createdAt: new Date().toISOString() },
    { id: "u-6", username: "kythuat", fullName: "Đỗ Gia Huy", role: UserRole.KY_THUAT, phone: "0966.777.888", email: "kythuat@hanhphucviet.com", createdAt: new Date().toISOString() },
    { id: "u-7", username: "nhancong", fullName: "Vũ Văn Lực", role: UserRole.NHAN_CONG, phone: "0977.888.999", email: "nhancong@hanhphucviet.com", createdAt: new Date().toISOString() },
  ];

  const initialPasswords: Record<string, string> = {
    "u-1": passwordAdmin,
    "u-2": passwordGiamDoc,
    "u-3": passwordPM,
    "u-4": passwordKeToan,
    "u-5": passwordKho,
    "u-6": passwordKyThuat,
    "u-7": passwordNhanCong,
  };

  const initialClients: Client[] = [
    { id: "c-1", code: "KH001", fullName: "Nguyễn Thị Mai Anh", phone: "0909123456", email: "maianh@gmail.com", address: "15 Tràng Tiền, Hoàn Kiếm, Hà Nội", idCard: "012345678901", notes: "Khách hàng dự án Biệt thự mái thái", createdAt: new Date().toISOString() },
    { id: "c-2", code: "KH002", fullName: "Phạm Hồng Thái", phone: "0918765432", email: "hongthai@yahoo.com", address: "88 Nguyễn Huệ, Quận 1, TP. HCM", idCard: "023456789012", notes: "Chủ đầu tư chuỗi nhà thuốc sỉ", createdAt: new Date().toISOString() },
    { id: "c-3", code: "KH003", fullName: "Vũ Minh Quân", phone: "0982345678", email: "minhquan.land@gmail.com", address: "32 Lê Lợi, Hải Châu, Đà Nẵng", idCard: "034567890123", notes: "Dự án Thiết kế tường panel văn phòng", createdAt: new Date().toISOString() },
  ];

  const defaultPhases = [
    { name: "Khảo sát", percentage: 100, status: 'done' as const, startDate: "2026-05-10", endDate: "2026-05-12" },
    { name: "Thiết kế", percentage: 100, status: 'done' as const, startDate: "2026-05-13", endDate: "2026-05-18" },
    { name: "Xin phép", percentage: 100, status: 'done' as const, startDate: "2026-05-19", endDate: "2026-06-01" },
    { name: "Móng", percentage: 100, status: 'done' as const, startDate: "2026-06-02", endDate: "2026-06-15" },
    { name: "Khung", percentage: 60, status: 'doing' as const, startDate: "2026-06-16", endDate: "2026-06-28" },
    { name: "Tường Panel", percentage: 0, status: 'todo' as const, startDate: "2026-06-29", endDate: "2026-07-10" },
    { name: "Mái", percentage: 0, status: 'todo' as const, startDate: "2026-07-11", endDate: "2026-07-20" },
    { name: "Điện nước", percentage: 0, status: 'todo' as const, startDate: "2026-07-21", endDate: "2026-07-30" },
    { name: "Hoàn thiện", percentage: 0, status: 'todo' as const, startDate: "2026-08-01", endDate: "2026-08-15" },
    { name: "Bàn giao", percentage: 0, status: 'todo' as const, startDate: "2026-08-16", endDate: "2026-08-20" },
  ];

  const initialProjects: ConstructionProject[] = [
    {
      id: "p-1",
      code: "CT001",
      name: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông",
      ownerId: "c-1",
      ownerName: "Nguyễn Thị Mai Anh",
      address: "Khu đô thị Văn Quán, Hà Đông, Hà Nội",
      startDate: "2026-05-10",
      endDateExpected: "2026-08-20",
      contractValue: 1850000000,
      status: ProjectStatus.THI_CONG,
      phases: defaultPhases,
      documents: [
        { id: "doc-1", name: "Hợp_đồng_thi_công_CT001.pdf", type: "contract", url: "#", uploadedAt: "2026-05-10T08:00:00Z", uploadedBy: "Lê Thị Thảo" },
        { id: "doc-2", name: "Bản_vẽ_thiết_kế_mặt_bằng_3D.jpg", type: "drawing", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=80", uploadedAt: "2026-05-14T14:30:00Z", uploadedBy: "Đỗ Gia Huy" },
      ],
      createdAt: "2026-05-10T07:30:00Z"
    },
    {
      id: "p-2",
      code: "CT002",
      name: "Nhà xưởng Công nghệ cao Thái Bình",
      ownerId: "c-2",
      ownerName: "Phạm Hồng Thái",
      address: "Khu công nghiệp Phúc Khánh, TP. Thái Bình",
      startDate: "2026-06-01",
      endDateExpected: "2026-11-30",
      contractValue: 4200000000,
      status: ProjectStatus.CHUAN_BI,
      phases: defaultPhases.map(ph => ({ ...ph, percentage: ph.name === "Khảo sát" ? 50 : 0, status: ph.name === "Khảo sát" ? "doing" : "todo" })),
      documents: [
        { id: "doc-3", name: "Giấy_phép_xây_dựng_cho_phép.pdf", type: "document", url: "#", uploadedAt: "2026-06-03T09:00:00Z", uploadedBy: "Phạm Minh Trí" },
      ],
      createdAt: "2026-06-01T08:00:00Z"
    },
    {
      id: "p-3",
      code: "CT003",
      name: "Cải tạo Nhà lắp ghép Panel Đà Nẵng",
      ownerId: "c-3",
      ownerName: "Vũ Minh Quân",
      address: "128 Điện Biên Phủ, Thanh Khê, Đà Nẵng",
      startDate: "2026-04-01",
      endDateExpected: "2026-05-20",
      contractValue: 550000000,
      status: ProjectStatus.HOAN_THANH,
      phases: defaultPhases.map(ph => ({ ...ph, percentage: 100, status: "done" })),
      documents: [
        { id: "doc-4", name: "Biên_bản_nghiệm_thu_bàn_giao_kí.pdf", type: "document", url: "#", uploadedAt: "2026-05-20T16:00:00Z", uploadedBy: "Phạm Minh Trí" },
      ],
      createdAt: "2026-04-01T08:00:00Z"
    }
  ];

  const initialDiaries: DailyDiary[] = [
    {
      id: "d-1",
      projectId: "p-1",
      projectName: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông",
      date: "2026-06-21",
      updatedBy: "Đỗ Gia Huy",
      tasksDone: "Hàn cố định hệ đà sắt ngang hỗ trợ lợp vách panel tường tầng 1. Đi ống bảo ôn ME cho phòng khách.",
      workersCount: 12,
      notes: "Thời tiết khô ráo, nhân công làm việc năng suất tốt. Không phát sinh rủi ro lao động.",
      media: [
        { id: "med-1", type: "image", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80" }
      ],
      createdAt: "2026-06-21T17:00:00Z"
    },
    {
      id: "d-2",
      projectId: "p-1",
      projectName: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông",
      date: "2026-06-20",
      updatedBy: "Đỗ Gia Huy",
      tasksDone: "Đổ bê tông giằng móng phụ. Che chắn bảo quản xi măng chống ẩm trước khi lợp vách.",
      workersCount: 10,
      notes: "Chiều mưa nhẹ khoảng 30 phút, không ảnh hưởng nhiều tới tiến độ.",
      media: [
        { id: "med-2", type: "image", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=500&q=80" }
      ],
      createdAt: "2026-06-20T17:30:00Z"
    }
  ];

  const initialStaff: Staff[] = [
    { id: "s-1", code: "NV001", fullName: "Phạm Minh Trí", position: "Chỉ huy trưởng", department: "Kỹ thuật", phone: "0933444555", currentProjectId: "p-1", attendance: [], createdAt: new Date().toISOString() },
    { id: "s-2", code: "NV002", fullName: "Đỗ Gia Huy", position: "Kỹ sư giám sát", department: "Kỹ thuật", phone: "0966777888", currentProjectId: "p-1", attendance: [], createdAt: new Date().toISOString() },
    { id: "s-3", code: "NV003", fullName: "Lê Thị Thảo", position: "Kế toán trưởng", department: "Tài chính", phone: "0944555666", attendance: [], createdAt: new Date().toISOString() },
    { id: "s-4", code: "NV004", fullName: "Vũ Văn Lực", position: "Tổ trưởng thi công", department: "Thi công", phone: "0977888999", currentProjectId: "p-1", attendance: [], createdAt: new Date().toISOString() },
    { id: "s-5", code: "NV005", fullName: "Trần Anh Quân", position: "Thợ cơ khí", department: "Thi công", phone: "0911222444", currentProjectId: "p-1", attendance: [], createdAt: new Date().toISOString() },
  ];

  const initialMaterials: Material[] = [
    { id: "m-1", code: "VT001", name: "Tấm EPS Panel cách nhiệt 50mm", category: MaterialCategory.PANEL, unit: "m2", importPrice: 220000, exportPrice: 280000, stock: 150, minStock: 200 },
    { id: "m-2", code: "VT002", name: "Sắt hộp mạ kẽm Hoa Sen 50x100", category: MaterialCategory.SAT_THEP, unit: "Cây", importPrice: 180000, exportPrice: 240000, stock: 85, minStock: 30 },
    { id: "m-3", code: "VT003", name: "Xi măng Hoàng Thạch PCB40", category: MaterialCategory.XI_MANG, unit: "Bao", importPrice: 85000, exportPrice: 110000, stock: 15, minStock: 50 },
    { id: "m-4", code: "VT004", name: "Cát vàng xây dựng hạt to", category: MaterialCategory.CAT_DA, unit: "m3", importPrice: 350000, exportPrice: 420000, stock: 24, minStock: 10 },
    { id: "m-5", code: "VT005", name: "Dây cáp điện Cadisun 2x4", category: MaterialCategory.DIEN_NUOC, unit: "Cuộn", importPrice: 650000, exportPrice: 780000, stock: 18, minStock: 5 },
    { id: "m-6", code: "VT006", name: "Máy khoan bê tông Bosch", category: MaterialCategory.THIET_BI, unit: "Bộ", importPrice: 2100000, exportPrice: 2500000, stock: 4, minStock: 2 },
  ];

  const initialStockTransactions: StockTransaction[] = [
    { id: "st-1", materialId: "m-1", materialName: "Tấm EPS Panel cách nhiệt 50mm", type: "import", quantity: 300, previousQuantity: 0, date: "2026-06-10T08:30:00Z", performedBy: "Hoàng Văn Khoa", notes: "Nhập kho chuẩn bị công trình CT001" },
    { id: "st-2", materialId: "m-1", materialName: "Tấm EPS Panel cách nhiệt 50mm", type: "export", quantity: 150, previousQuantity: 300, date: "2026-06-12T14:20:00Z", performedBy: "Hoàng Văn Khoa", notes: "Xuất xưởng bàn giao lắp vách công trình CT001" },
    { id: "st-3", materialId: "m-3", materialName: "Xi măng Hoàng Thạch PCB40", type: "import", quantity: 100, previousQuantity: 0, date: "2026-06-11T09:00:00Z", performedBy: "Hoàng Văn Khoa", notes: "Nhập mua đại lý cấp 1" },
    { id: "st-4", materialId: "m-3", materialName: "Xi măng Hoàng Thạch PCB40", type: "export", quantity: 85, previousQuantity: 100, date: "2026-06-15T15:00:00Z", performedBy: "Hoàng Văn Khoa", notes: "Bàn giao thợ xây dựng móng giằng" },
  ];

  const initialCashTransactions: CashTransaction[] = [
    { id: "ct-1", type: "thu", category: "advance", projectId: "p-1", projectName: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông", amount: 370000000, date: "2026-05-11", performedBy: "Lê Thị Thảo", notes: "Tạm ứng đợt 1 ngay sau khi ký kết hợp đồng" },
    { id: "ct-2", type: "thu", category: "payment", projectId: "p-3", projectName: "Cải tạo Nhà lắp ghép Panel Đà Nẵng", amount: 550000000, date: "2026-05-22", performedBy: "Lê Thị Thảo", notes: "Thanh toán đợt thanh lý quyết toán bàn giao CT003" },
    { id: "ct-3", type: "chi", category: "material", projectId: "p-1", projectName: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông", amount: 120000000, date: "2026-06-12", performedBy: "Lê Thị Thảo", notes: "Thanh toán hoá đơn Panel cách nhiệt" },
    { id: "ct-4", type: "chi", category: "labor", projectId: "p-1", projectName: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông", amount: 45000000, date: "2026-06-15", performedBy: "Lê Thị Thảo", notes: "Chi tạm ứng nhân công tuần móng dóng dóng" },
    { id: "ct-5", type: "chi", category: "machinery", projectId: "p-1", projectName: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông", amount: 28000000, date: "2026-06-02", performedBy: "Lê Thị Thảo", notes: "Thuê máy xúc dọn mặt bằng và đào móng 3 ngày" },
  ];

  const initialContracts: Contract[] = [
    {
      id: "cn-1",
      contractNo: "05/2026/HDXD-HPV",
      signedDate: "2026-05-10",
      value: 1850000000,
      clientId: "c-1",
      clientName: "Nguyễn Thị Mai Anh",
      projectId: "p-1",
      projectName: "Biệt thự Panel Thân thiện Hạnh Phúc Việt - Hà Đông",
      fileUrl: "#",
      fileName: "HDXD_HanhPhucViet_MaiAnh_VanQuan.pdf",
      paymentMilestones: [
        { milestone: "Tạm ứng khi ký HĐ (20%)", percentage: 20, amount: 370000000, dueDate: "2026-05-15", status: "paid" },
        { milestone: "Hoàn thành phần móng dầm (30%)", percentage: 30, amount: 555000000, dueDate: "2026-06-25", status: "unpaid" },
        { milestone: "Hoàn thiện lợp vách & mái (30%)", percentage: 30, amount: 555000000, dueDate: "2026-07-25", status: "unpaid" },
        { milestone: "Nghiệm thu thanh lý (20%)", percentage: 20, amount: 370000000, dueDate: "2026-08-25", status: "unpaid" },
      ],
      createdAt: "2026-05-10T08:00:00Z"
    },
    {
      id: "cn-2",
      contractNo: "12/2026/HDXD-HPV",
      signedDate: "2026-06-01",
      value: 4200000000,
      clientId: "c-2",
      clientName: "Phạm Hồng Thái",
      projectId: "p-2",
      projectName: "Nhà xưởng Công nghệ cao Thái Bình",
      fileUrl: "#",
      fileName: "HDXD_NhaXuong_ThaiBinh_PhucKhanh.pdf",
      paymentMilestones: [
        { milestone: "Tạm ứng đợt 1", percentage: 15, amount: 630000000, dueDate: "2026-06-10", status: "unpaid" },
        { milestone: "Hoàn thiện nền móng và cột", percentage: 25, amount: 1050000000, dueDate: "2026-07-20", status: "unpaid" },
      ],
      createdAt: "2026-06-01T08:15:00Z"
    }
  ];

  const initialNotifications: NotificationLog[] = [
    { id: "n-1", type: "low_stock", message: "Cảnh báo tốn kho: Vật tư 'Xi măng Hoàng Thạch PCB40' còn 15 Bao, dưới mức tối thiểu (50 Bao).", sentAt: "2026-06-21T06:00:00Z", channels: ["Telegram", "SMS"], status: "sent" },
    { id: "n-2", type: "payment_due", message: "Nhắc nhở thanh toán đợt 2 cho hợp đồng của Nguyễn Thị Mai Anh (CT001) vào ngày 2026-06-25.", sentAt: "2026-06-20T08:00:00Z", channels: ["Email", "Telegram"], status: "sent" },
    { id: "n-3", type: "delay", message: "Công trình CT001 đang chậm 2 ngày thi công tiến độ Khung.", sentAt: "2026-06-19T09:00:00Z", channels: ["Email"], status: "sent" }
  ];

  const db: DbSchema = {
    users: initialUsers,
    userPasswords: initialPasswords,
    clients: initialClients,
    projects: initialProjects,
    diaries: initialDiaries,
    staff: initialStaff,
    materials: initialMaterials,
    stockTransactions: initialStockTransactions,
    cashTransactions: initialCashTransactions,
    contracts: initialContracts,
    notifications: initialNotifications,
    auditLogs: []
  };

  logAction("system", "Hệ thống", "Khởi tạo cơ sở dữ liệu Hạnh Phúc Việt", db);
  saveDb(db);
  return db;
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save db.json", e);
  }
}

// Ensure database folders and structures exist
const db = loadDb();

const app = express();
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware for token validation
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy token phiên làm việc." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, tokenDecoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    }
    const currentDb = loadDb();
    const foundUser = currentDb.users.find(u => u.id === tokenDecoded.id);
    if (!foundUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng này." });
    }
    req.user = foundUser;
    next();
  });
}

// Middleware for checking explicit roles
function requireRoles(roles: UserRole[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Bạn không có quyền thực hiện hành động này. Vai trò yêu cầu: ${roles.join(", ")}` 
      });
    }
    next();
  };
}

// ====== API: AUTHENTICATION ======

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Vui lòng cung cấp tài khoản và mật khẩu." });
  }

  const currentDb = loadDb();
  const user = currentDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không chính xác." });
  }

  const storedHashedPassword = currentDb.userPasswords[user.id];
  const isMatch = bcryptjs.compareSync(password, storedHashedPassword);
  if (!isMatch) {
    return res.status(401).json({ message: "Tài khoản hoặc mật khẩu không chính xác." });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
  logAction(user.id, user.fullName, `Đăng nhập hệ thống (${user.role})`, currentDb);
  saveDb(currentDb);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      email: user.email
    }
  });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// ====== API: USERS / PHÂN QUYỀN ======

app.get("/api/users", authenticateToken, requireRoles([UserRole.ADMIN]), (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.users);
});

app.post("/api/users", authenticateToken, requireRoles([UserRole.ADMIN]), (req: any, res) => {
  const { username, fullName, role, phone, email, password } = req.body;
  if (!username || !fullName || !role || !password) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc." });
  }

  const currentDb = loadDb();
  if (currentDb.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ message: "Tên đăng nhập đã tồn tại trong hệ thống." });
  }

  const salt = bcryptjs.genSaltSync(10);
  const hashedPassword = bcryptjs.hashSync(password, salt);

  const newUser: User = {
    id: `u-${Date.now()}`,
    username,
    fullName,
    role,
    phone,
    email,
    createdAt: new Date().toISOString()
  };

  currentDb.users.push(newUser);
  currentDb.userPasswords[newUser.id] = hashedPassword;
  
  logAction(req.user.id, req.user.fullName, `Tạo tài khoản mới: ${username} (${role})`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newUser);
});

app.delete("/api/users/:id", authenticateToken, requireRoles([UserRole.ADMIN]), (req: any, res) => {
  const currentDb = loadDb();
  const index = currentDb.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Không tìm thấy người dùng." });
  }

  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản chính mình." });
  }

  const userToDelete = currentDb.users[index];
  currentDb.users.splice(index, 1);
  delete currentDb.userPasswords[req.params.id];

  logAction(req.user.id, req.user.fullName, `Xóa tài khoản: ${userToDelete.username}`, currentDb);
  saveDb(currentDb);
  res.json({ message: "Xóa tài khoản thành công." });
});

// ====== API: CLIENTS ======

app.get("/api/clients", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.clients);
});

app.post("/api/clients", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM, UserRole.KE_TOAN]), (req: any, res) => {
  const { fullName, phone, email, address, idCard, notes } = req.body;
  if (!fullName || !phone || !idCard) {
    return res.status(400).json({ message: "Họ tên, số điện thoại, và CCCD là bắt buộc." });
  }

  const currentDb = loadDb();
  const code = `KH${String(currentDb.clients.length + 1).padStart(3, "0")}`;
  const newClient: Client = {
    id: `c-${Date.now()}`,
    code,
    fullName,
    phone,
    email: email || "",
    address: address || "",
    idCard,
    notes,
    createdAt: new Date().toISOString()
  };

  currentDb.clients.push(newClient);
  logAction(req.user.id, req.user.fullName, `Thêm khách hàng: ${fullName} (${code})`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newClient);
});

app.put("/api/clients/:id", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM, UserRole.KE_TOAN]), (req: any, res) => {
  const currentDb = loadDb();
  const client = currentDb.clients.find(c => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ message: "Không tìm thấy khách hàng." });
  }

  const { fullName, phone, email, address, idCard, notes } = req.body;
  if (fullName) client.fullName = fullName;
  if (phone) client.phone = phone;
  if (email !== undefined) client.email = email;
  if (address !== undefined) client.address = address;
  if (idCard) client.idCard = idCard;
  if (notes !== undefined) client.notes = notes;

  logAction(req.user.id, req.user.fullName, `Cập nhật khách hàng: ${client.fullName} (${client.code})`, currentDb);
  saveDb(currentDb);
  res.json(client);
});

app.delete("/api/clients/:id", authenticateToken, requireRoles([UserRole.ADMIN]), (req: any, res) => {
  const currentDb = loadDb();
  const index = currentDb.clients.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Không tìm thấy khách hàng." });
  }

  const client = currentDb.clients[index];
  currentDb.clients.splice(index, 1);
  logAction(req.user.id, req.user.fullName, `Xóa khách hàng: ${client.fullName}`, currentDb);
  saveDb(currentDb);
  res.json({ message: "Xóa khách hàng thành công." });
});

// ====== API: PROJECTS ======

app.get("/api/projects", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.projects);
});

app.post("/api/projects", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM]), (req: any, res) => {
  const { name, ownerId, address, startDate, endDateExpected, contractValue, status } = req.body;
  if (!name || !ownerId || !startDate || !endDateExpected || !contractValue) {
    return res.status(400).json({ message: "Tên công trình, chủ đầu tư, ngày thi công và giá trị là bắt buộc." });
  }

  const currentDb = loadDb();
  const owner = currentDb.clients.find(c => c.id === ownerId);
  if (!owner) {
    return res.status(404).json({ message: "Chủ đầu tư không hợp lệ." });
  }

  const code = `CT${String(currentDb.projects.length + 1).padStart(3, "0")}`;

  const defaultPhases = [
    { name: "Khảo sát", percentage: 0, status: 'todo' as const, startDate, endDate: startDate },
    { name: "Thiết kế", percentage: 0, status: 'todo' as const },
    { name: "Xin phép", percentage: 0, status: 'todo' as const },
    { name: "Móng", percentage: 0, status: 'todo' as const },
    { name: "Khung", percentage: 0, status: 'todo' as const },
    { name: "Tường Panel", percentage: 0, status: 'todo' as const },
    { name: "Mái", percentage: 0, status: 'todo' as const },
    { name: "Điện nước", percentage: 0, status: 'todo' as const },
    { name: "Hoàn thiện", percentage: 0, status: 'todo' as const },
    { name: "Bàn giao", percentage: 0, status: 'todo' as const },
  ];

  const newProject: ConstructionProject = {
    id: `p-${Date.now()}`,
    code,
    name,
    ownerId,
    ownerName: owner.fullName,
    address,
    startDate,
    endDateExpected,
    contractValue: Number(contractValue),
    status: status || ProjectStatus.CHUAN_BI,
    phases: defaultPhases,
    documents: [],
    createdAt: new Date().toISOString()
  };

  currentDb.projects.push(newProject);
  logAction(req.user.id, req.user.fullName, `Khởi tạo dự án công trình: ${name} (${code})`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newProject);
});

app.put("/api/projects/:id", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM]), (req: any, res) => {
  const currentDb = loadDb();
  const project = currentDb.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Không tìm thấy công trình." });
  }

  const { name, address, startDate, endDateExpected, contractValue, status, phases } = req.body;
  if (name) project.name = name;
  if (address) project.address = address;
  if (startDate) project.startDate = startDate;
  if (endDateExpected) project.endDateExpected = endDateExpected;
  if (contractValue !== undefined) project.contractValue = Number(contractValue);
  if (status) project.status = status;
  if (phases) project.phases = phases;

  logAction(req.user.id, req.user.fullName, `Cập nhật dự án công trình: ${project.name} (${project.code})`, currentDb);
  saveDb(currentDb);
  res.json(project);
});

app.delete("/api/projects/:id", authenticateToken, requireRoles([UserRole.ADMIN]), (req: any, res) => {
  const currentDb = loadDb();
  const index = currentDb.projects.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Không tìm thấy công trình." });
  }

  const project = currentDb.projects[index];
  currentDb.projects.splice(index, 1);
  logAction(req.user.id, req.user.fullName, `Xóa công trình: ${project.name}`, currentDb);
  saveDb(currentDb);
  res.json({ message: "Xóa công trình thành công." });
});

// Project documents upload
app.post("/api/projects/:id/documents", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM, UserRole.KY_THUAT]), (req: any, res) => {
  const { name, type, url } = req.body;
  if (!name || !type) {
    return res.status(400).json({ message: "Vui lòng nhập tên tài liệu và phần loại." });
  }

  const currentDb = loadDb();
  const project = currentDb.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Không tìm thấy công trình." });
  }

  const newDoc = {
    id: `doc-${Date.now()}`,
    name,
    type,
    url: url || "#",
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user.fullName
  };

  project.documents.push(newDoc);
  logAction(req.user.id, req.user.fullName, `Upload tài liệu ${name} lên dự án ${project.name}`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newDoc);
});

app.delete("/api/projects/:projectId/documents/:docId", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM]), (req: any, res) => {
  const currentDb = loadDb();
  const project = currentDb.projects.find(p => p.id === req.params.projectId);
  if (!project) {
    return res.status(404).json({ message: "Không tìm thấy công trình." });
  }

  const docIndex = project.documents.findIndex(d => d.id === req.params.docId);
  if (docIndex === -1) {
    return res.status(404).json({ message: "Không tìm thấy tài liệu cần xóa." });
  }

  const doc = project.documents[docIndex];
  project.documents.splice(docIndex, 1);
  logAction(req.user.id, req.user.fullName, `Xóa tài liệu ${doc.name} thuộc dự án ${project.name}`, currentDb);
  saveDb(currentDb);
  res.json({ message: "Xóa tài liệu thành công." });
});

// ====== API: DAILY SITE DIARY LOGS ======

app.get("/api/diaries", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.diaries);
});

app.post("/api/diaries", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.KY_THUAT, UserRole.PM]), (req: any, res) => {
  const { projectId, date, tasksDone, workersCount, notes, media } = req.body;
  if (!projectId || !date || !tasksDone || workersCount === undefined) {
    return res.status(400).json({ message: "Dự án, ngày nhập nhật ký, nội dung công việc và số lượng nhân công là bắt buộc." });
  }

  const currentDb = loadDb();
  const project = currentDb.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ message: "Dự án liên đới không tồn tại." });
  }

  const newDiary: DailyDiary = {
    id: `d-${Date.now()}`,
    projectId,
    projectName: project.name,
    date,
    updatedBy: req.user.fullName,
    tasksDone,
    workersCount: Number(workersCount),
    notes: notes || "",
    media: media || [],
    createdAt: new Date().toISOString()
  };

  currentDb.diaries.unshift(newDiary);
  logAction(req.user.id, req.user.fullName, `Nhập nhật ký công trình ngày ${date} của dự án ${project.name}`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newDiary);
});

app.delete("/api/diaries/:id", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM]), (req: any, res) => {
  const currentDb = loadDb();
  const index = currentDb.diaries.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Không tìm thấy nhật ký công trình." });
  }

  const diary = currentDb.diaries[index];
  currentDb.diaries.splice(index, 1);
  logAction(req.user.id, req.user.fullName, `Xóa nhật ký ngày ${diary.date} thuộc dự án ${diary.projectName}`, currentDb);
  saveDb(currentDb);
  res.json({ message: "Xóa nhật ký thành công." });
});

// ====== API: HR STAFF & ATTENDANCE ======

app.get("/api/staff", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.staff);
});

app.post("/api/staff", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM]), (req: any, res) => {
  const { fullName, position, department, phone, currentProjectId } = req.body;
  if (!fullName || !position || !department || !phone) {
    return res.status(400).json({ message: "Họ tên, chức vụ, bộ phận và sđt là bắt buộc." });
  }

  const currentDb = loadDb();
  const code = `NV${String(currentDb.staff.length + 1).padStart(3, "0")}`;
  const newStaff: Staff = {
    id: `s-${Date.now()}`,
    code,
    fullName,
    position,
    department,
    phone,
    currentProjectId,
    attendance: [],
    createdAt: new Date().toISOString()
  };

  currentDb.staff.push(newStaff);
  logAction(req.user.id, req.user.fullName, `Thêm nhân sự mới: ${fullName} (${code})`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newStaff);
});

app.put("/api/staff/:id", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM]), (req: any, res) => {
  const currentDb = loadDb();
  const staff = currentDb.staff.find(s => s.id === req.params.id);
  if (!staff) {
    return res.status(404).json({ message: "Không tìm thấy nhân viên." });
  }

  const { fullName, position, department, phone, currentProjectId } = req.body;
  if (fullName) staff.fullName = fullName;
  if (position) staff.position = position;
  if (department) staff.department = department;
  if (phone) staff.phone = phone;
  if (currentProjectId !== undefined) staff.currentProjectId = currentProjectId;

  logAction(req.user.id, req.user.fullName, `Cập nhật nhân sự: ${staff.fullName} (${staff.code})`, currentDb);
  saveDb(currentDb);
  res.json(staff);
});

// Attendances check and update (Tăng ca, chấm công, nghỉ phép)
app.post("/api/staff/:id/attendance", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM, UserRole.NHAN_CONG]), (req: any, res) => {
  const { date, status, overtimeHours, notes } = req.body;
  if (!date || !status) {
    return res.status(400).json({ message: "Ngày chấm công và trạng thái là bắt buộc." });
  }

  const currentDb = loadDb();
  const employee = currentDb.staff.find(s => s.id === req.params.id);
  if (!employee) {
    return res.status(404).json({ message: "Không tìm thấy nhân viên." });
  }

  if (!employee.attendance) {
    employee.attendance = [];
  }

  // Check if attendance already exists for this date, modify it, or add new
  const index = employee.attendance.findIndex(a => a.date === date);
  const entry = {
    date,
    status: status as 'present' | 'absent' | 'leave',
    overtimeHours: overtimeHours ? Number(overtimeHours) : 0,
    notes: notes || ""
  };

  if (index !== -1) {
    employee.attendance[index] = entry;
  } else {
    employee.attendance.push(entry);
  }

  logAction(req.user.id, req.user.fullName, `Chấm công ngày ${date} cho ${employee.fullName} (${status}, Tăng ca: ${overtimeHours || 0}h)`, currentDb);
  saveDb(currentDb);
  res.json(employee);
});

app.delete("/api/staff/:id", authenticateToken, requireRoles([UserRole.ADMIN]), (req: any, res) => {
  const currentDb = loadDb();
  const index = currentDb.staff.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Không tìm thấy nhân sự." });
  }

  const employee = currentDb.staff[index];
  currentDb.staff.splice(index, 1);
  logAction(req.user.id, req.user.fullName, `Xóa tài liệu nhân sự: ${employee.fullName}`, currentDb);
  saveDb(currentDb);
  res.json({ message: "Xóa nhân sự thành công." });
});

// ====== API: MATERIALS & STOCK ======

app.get("/api/materials", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.materials);
});

app.post("/api/materials", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.KHO, UserRole.PM]), (req: any, res) => {
  const { name, category, unit, importPrice, exportPrice, stock, minStock } = req.body;
  if (!name || !category || !unit || importPrice === undefined || exportPrice === undefined) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ các trường thông tin vật tư." });
  }

  const currentDb = loadDb();
  const code = `VT${String(currentDb.materials.length + 1).padStart(3, "0")}`;

  const newMaterial: Material = {
    id: `m-${Date.now()}`,
    code,
    name,
    category: category as MaterialCategory,
    unit,
    importPrice: Number(importPrice),
    exportPrice: Number(exportPrice),
    stock: stock ? Number(stock) : 0,
    minStock: minStock ? Number(minStock) : 10
  };

  currentDb.materials.push(newMaterial);
  logAction(req.user.id, req.user.fullName, `Thêm danh mục vật tư mới: ${name} (${code})`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newMaterial);
});

app.put("/api/materials/:id", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.KHO, UserRole.PM]), (req: any, res) => {
  const currentDb = loadDb();
  const material = currentDb.materials.find(m => m.id === req.params.id);
  if (!material) {
    return res.status(404).json({ message: "Không tìm thấy vật tư." });
  }

  const { name, category, unit, importPrice, exportPrice, minStock } = req.body;
  if (name) material.name = name;
  if (category) material.category = category as MaterialCategory;
  if (unit) material.unit = unit;
  if (importPrice !== undefined) material.importPrice = Number(importPrice);
  if (exportPrice !== undefined) material.exportPrice = Number(exportPrice);
  if (minStock !== undefined) material.minStock = Number(minStock);

  logAction(req.user.id, req.user.fullName, `Cập nhật danh mục vật tư: ${material.name} (${material.code})`, currentDb);
  saveDb(currentDb);
  res.json(material);
});

// Nhập kho / Xuất kho / Kiểm kê
app.post("/api/materials/transactions", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.KHO, UserRole.PM]), (req: any, res) => {
  const { materialId, type, quantity, actualQuantity, notes } = req.body;
  if (!materialId || !type || quantity === undefined) {
    return res.status(400).json({ message: "Thông tin mã vật tư, dạng giao dịch và số lượng là bắt buộc." });
  }

  const currentDb = loadDb();
  const material = currentDb.materials.find(m => m.id === materialId);
  if (!material) {
    return res.status(404).json({ message: "Không tồn tại vật tư cần cập nhật kho." });
  }

  const prevStock = material.stock;
  let nextStock = prevStock;

  if (type === "import") {
    nextStock += Number(quantity);
  } else if (type === "export") {
    if (prevStock < Number(quantity)) {
      return res.status(400).json({ message: `Hàng tồn kho không đủ để xuất. Tồn hiện tại: ${prevStock} ${material.unit}` });
    }
    nextStock -= Number(quantity);
  } else if (type === "audit") {
    if (actualQuantity === undefined) {
      return res.status(400).json({ message: "Vui lòng nhập số kiểm đếm thực tế." });
    }
    nextStock = Number(actualQuantity);
  }

  material.stock = nextStock;

  const newTx: StockTransaction = {
    id: `st-${Date.now()}`,
    materialId,
    materialName: material.name,
    type: type as 'import' | 'export' | 'audit',
    quantity: Number(quantity),
    previousQuantity: prevStock,
    actualQuantity: type === 'audit' ? Number(actualQuantity) : undefined,
    date: new Date().toISOString(),
    performedBy: req.user.fullName,
    notes: notes || ""
  };

  currentDb.stockTransactions.unshift(newTx);

  // Trigger low stock notification automatically if now under minStock
  if (nextStock < material.minStock) {
    const alertMsg = `Cảnh báo tốn kho: Vật tư '${material.name}' còn ${nextStock} ${material.unit}, dưới mức tối thiểu (${material.minStock} ${material.unit}).`;
    // Add real-time mock notification log
    currentDb.notifications.unshift({
      id: `n-${Date.now()}`,
      type: "low_stock",
      message: alertMsg,
      sentAt: new Date().toISOString(),
      channels: ["Telegram", "Email"],
      status: "sent"
    });
  }

  logAction(req.user.id, req.user.fullName, `Giao dịch kho: ${type === 'import' ? 'Nhập' : type === 'export' ? 'Xuất' : 'Kiểm kê'} vật tư ${material.name} (SL: ${quantity})`, currentDb);
  saveDb(currentDb);
  res.status(201).json({ material, transaction: newTx });
});

app.get("/api/materials/transactions", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.stockTransactions);
});

// ====== API: CASH FLOW TRANSACTIONS ======

app.get("/api/cash-transactions", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.cashTransactions);
});

app.post("/api/cash-transactions", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.KE_TOAN]), (req: any, res) => {
  const { type, category, projectId, amount, date, notes } = req.body;
  if (!type || !category || !amount || !date) {
    return res.status(400).json({ message: "Vui lòng điền trạng thái thu/chi, phân loại, giá trị giao dịch và ngày giao dịch." });
  }

  const currentDb = loadDb();
  let projName = undefined;
  if (projectId) {
    const proj = currentDb.projects.find(p => p.id === projectId);
    if (proj) {
      projName = proj.name;
    }
  }

  const newTx: CashTransaction = {
    id: `ct-${Date.now()}`,
    type: type as 'thu' | 'chi',
    category: category as any,
    projectId,
    projectName: projName,
    amount: Number(amount),
    date,
    performedBy: req.user.fullName,
    notes: notes || ""
  };

  currentDb.cashTransactions.unshift(newTx);
  logAction(req.user.id, req.user.fullName, `Ghi nhận giao dịch tài chính: ${type.toUpperCase()} - ${category} (Số tiền: ${Number(amount).toLocaleString()}đ)`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newTx);
});

// Phê duyệt chi phí (Cho phép Admin duyệt)
app.post("/api/cash-transactions/approve", authenticateToken, requireRoles([UserRole.ADMIN]), (req: any, res) => {
  const currentDb = loadDb();
  // We can log that admin approved recent payouts
  logAction(req.user.id, req.user.fullName, "Phê duyệt toán bộ chi phí tài chính tuần hiện tại", currentDb);
  saveDb(currentDb);
  res.json({ message: "Phê duyệt chi phí thành công." });
});

// ====== API: CONTRACTS ======

app.get("/api/contracts", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.contracts);
});

app.post("/api/contracts", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM, UserRole.KE_TOAN]), (req: any, res) => {
  const { contractNo, signedDate, value, clientId, projectId, paymentMilestones, fileUrl, fileName } = req.body;
  if (!contractNo || !signedDate || !value || !clientId) {
    return res.status(400).json({ message: "Vui lòng điền số hợp đồng, ngày ký kết, tổng mức giá trị và khách hàng liên kết." });
  }

  const currentDb = loadDb();
  const client = currentDb.clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ message: "Khách hàng không chính xác." });
  }

  let projName = undefined;
  if (projectId) {
    const proj = currentDb.projects.find(p => p.id === projectId);
    if (proj) projName = proj.name;
  }

  const milestonesParsed = paymentMilestones || [
    { milestone: "Tạm ứng ký hợp đồng (30%)", percentage: 30, amount: Number(value) * 0.3, dueDate: signedDate, status: "unpaid" },
    { milestone: "Nghiệm thu thanh lý (70%)", percentage: 70, amount: Number(value) * 0.7, dueDate: signedDate, status: "unpaid" },
  ];

  const newContract: Contract = {
    id: `hd-${Date.now()}`,
    contractNo,
    signedDate,
    value: Number(value),
    clientId,
    clientName: client.fullName,
    projectId,
    projectName: projName,
    fileUrl: fileUrl || "#",
    fileName: fileName || "hop_dong_ky_ket.pdf",
    paymentMilestones: milestonesParsed,
    createdAt: new Date().toISOString()
  };

  currentDb.contracts.push(newContract);
  logAction(req.user.id, req.user.fullName, `Khởi tạo hợp đồng xây dựng số: ${contractNo}`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newContract);
});

// Update contract status and debts milestones
app.put("/api/contracts/:id/milestones/:mIndex", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.KE_TOAN]), (req: any, res) => {
  const currentDb = loadDb();
  const contract = currentDb.contracts.find(c => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ message: "Không tìm thấy hợp đồng." });
  }

  const idx = Number(req.params.mIndex);
  if (idx < 0 || idx >= contract.paymentMilestones.length) {
    return res.status(400).json({ message: "Phần mốc thanh toán lỗi." });
  }

  const status = req.body.status as 'paid' | 'unpaid';
  const milestoneObj = contract.paymentMilestones[idx];
  milestoneObj.status = status;

  // If status changed to paid, automatically create a cash receipt (Thu)
  if (status === "paid") {
    const newTx: CashTransaction = {
      id: `ct-${Date.now()}`,
      type: 'thu',
      category: 'payment',
      projectId: contract.projectId,
      projectName: contract.projectName,
      amount: milestoneObj.amount,
      date: new Date().toISOString().split('T')[0],
      performedBy: req.user.fullName,
      notes: `Nhận thanh toán giai đoạn: ${milestoneObj.milestone} thuộc hợp đồng ${contract.contractNo}`
    };
    currentDb.cashTransactions.unshift(newTx);
  }

  logAction(req.user.id, req.user.fullName, `Cập nhật trạng thái thanh toán mốc ${milestoneObj.milestone} cho hợp đồng ${contract.contractNo} sang ${status === 'paid' ? 'Đã thu' : 'Chưa thu'}`, currentDb);
  saveDb(currentDb);
  res.json(contract);
});

// ====== API: NOTIFICATIONS ======

app.get("/api/notifications", authenticateToken, (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.notifications);
});

app.post("/api/notifications/dispatch", authenticateToken, requireRoles([UserRole.ADMIN, UserRole.PM]), (req: any, res) => {
  const { type, message, channels } = req.body;
  if (!message || !type) {
    return res.status(400).json({ message: "Thiếu dữ liệu sự kiện phát báo động cảnh báo." });
  }

  const currentDb = loadDb();
  const channelsToSend = channels || ["Telegram", "SMS", "Email"];
  const newNotif: NotificationLog = {
    id: `n-${Date.now()}`,
    type,
    message,
    sentAt: new Date().toISOString(),
    channels: channelsToSend,
    status: "sent"
  };

  currentDb.notifications.unshift(newNotif);
  logAction(req.user.id, req.user.fullName, `Gửi thông báo khẩn cấp hệ thống qua [${channelsToSend.join(", ")}]: ${message}`, currentDb);
  saveDb(currentDb);
  res.status(201).json(newNotif);
});

// ====== API: SYSTEM BACKUP & SYSTEM LOGS ======

app.get("/api/system/logs", authenticateToken, requireRoles([UserRole.ADMIN]), (req, res) => {
  const currentDb = loadDb();
  res.json(currentDb.auditLogs);
});

app.post("/api/system/backup", authenticateToken, requireRoles([UserRole.ADMIN]), (req: any, res) => {
  const currentDb = loadDb();
  const backupDir = path.join(process.cwd(), "backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `db-backup-${timestamp}.json`);
  
  fs.writeFileSync(backupFile, JSON.stringify(currentDb, null, 2), "utf-8");
  logAction(req.user.id, req.user.fullName, `Sao lưu dữ liệu tự động hệ thống thành công file: db-backup-${timestamp}.json`, currentDb);
  saveDb(currentDb);

  res.json({ message: `Sao lưu cơ sở dữ liệu hệ thống thành công! Tên tệp: db-backup-${timestamp}.json`, filename: `db-backup-${timestamp}.json` });
});

// Handle Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Hanh Phuc Viet Construction] server is listening on port ${PORT}`);
  });
}

startServer();
