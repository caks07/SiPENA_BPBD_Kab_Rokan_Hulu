import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";

type User = {
  id: number;
  name: string;
  username: string;
  role_id: number;
  role: string;
  kecamatan_id: number | null;
  nama_kecamatan: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  password_plain?: string | null;
};

type ManualBook = {
  id: number;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number;
  uploaded_by_name: string;
  created_at: string;
};

const ROLES = [
  { id: 1, name: "admin", label: "Admin Kabupaten" },
  { id: 2, name: "pimpinan", label: "Kepala BPBD (Pimpinan)" },
  { id: 3, name: "operator", label: "Admin Kecamatan" },
];

export default function AdministratorPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"users" | "guides" | "settings">("users");

  // State Modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);

  // Form Fields - User Create/Edit
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [roleId, setRoleId] = useState(3); // Default operator
  const [kecamatanId, setKecamatanId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Form Fields - Manual Book Upload
  const [guideTitle, setGuideTitle] = useState("");
  const [guideFile, setGuideFile] = useState<File | null>(null);
  const [isUploadingGuide, setIsUploadingGuide] = useState(false);

  // Form Fields - Public Passcode Gate
  const [formPasscode, setFormPasscode] = useState("");
  const [formPasscodeConfirm, setFormPasscodeConfirm] = useState("");
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Custom Warnings Modal States
  const [cancelWarningOpen, setCancelWarningOpen] = useState(false);
  const [deactivateWarningOpen, setDeactivateWarningOpen] = useState(false);
  const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);
  const [deleteGuideConfirmOpen, setDeleteGuideConfirmOpen] = useState(false);
  
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [guideToDelete, setGuideToDelete] = useState<ManualBook | null>(null);

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Inline Form Error State
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isFormDirty = () => {
    if (userToEdit) {
      // Edit mode
      const initialKecId = userToEdit.kecamatan_id ? String(userToEdit.kecamatan_id) : "";
      return (
        name !== userToEdit.name ||
        username !== userToEdit.username ||
        password !== "" ||
        passwordConfirmation !== "" ||
        roleId !== userToEdit.role_id ||
        kecamatanId !== initialKecId ||
        isActive !== userToEdit.is_active
      );
    } else {
      // Create mode
      return (
        name !== "" ||
        username !== "" ||
        password !== "" ||
        passwordConfirmation !== "" ||
        roleId !== 3 ||
        kecamatanId !== "" ||
        isActive !== true
      );
    }
  };

  const handleCloseUserModal = () => {
    if (isFormDirty()) {
      setCancelWarningOpen(true);
    } else {
      setUserModalOpen(false);
      setFormError(null);
    }
  };

  // Queries
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await api.get("/admin/accounts");
      return data;
    },
  });

  const { data: kecamatans = [] } = useQuery({
    queryKey: ["kecamatan"],
    queryFn: async () => {
      const { data } = await api.get("/kecamatan");
      return data;
    },
  });

  const { data: guides = [], isLoading: isLoadingGuides } = useQuery<ManualBook[]>({
    queryKey: ["manual-books"],
    queryFn: async () => {
      const { data } = await api.get("/manual-books");
      return data;
    },
  });

  const { data: passcodeStatus } = useQuery({
    queryKey: ["form-passcode-status"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings/form-password-status");
      return data;
    },
  });

  // Mutations
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { data } = await api.patch(`/admin/accounts/${id}/toggle-active`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast(data.message || "Status aktif pengguna berhasil diubah.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || "Gagal mengubah status aktif.", "error");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/accounts/${id}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      showToast(data.message || "Pengguna berhasil dihapus.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || "Gagal menghapus pengguna.", "error");
    },
  });

  const deleteGuideMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/manual-books/${id}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-books"] });
      showToast(data.message || "Manual book berhasil dihapus.", "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || "Gagal menghapus manual book.", "error");
    },
  });

  // Open Modal Helpers
  const handleOpenAddUser = () => {
    setUserToEdit(null);
    setName("");
    setUsername("");
    setPassword("");
    setPasswordConfirmation("");
    setRoleId(3);
    setKecamatanId("");
    setIsActive(true);
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setFormError(null);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setUserToEdit(user);
    setName(user.name);
    setUsername(user.username);
    setPassword("");
    setPasswordConfirmation("");
    setRoleId(user.role_id);
    setKecamatanId(user.kecamatan_id ? String(user.kecamatan_id) : "");
    setIsActive(user.is_active);
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setFormError(null);
    setUserModalOpen(true);
  };

  const handleOpenViewUser = (user: User) => {
    setUserToView(user);
    setViewModalOpen(true);
  };

  // Submit Handlers
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!name.trim()) return setFormError("Nama lengkap wajib diisi.");
    if (name.trim().length < 3) return setFormError("Nama lengkap minimal harus 3 karakter.");
    if (!username.trim()) return setFormError("Username wajib diisi.");

    // Validate password
    if (!userToEdit) {
      if (!password) return setFormError("Password wajib diisi.");
      if (password.length < 8) return setFormError("Password minimal harus 8 karakter.");
      if (password !== passwordConfirmation) return setFormError("Konfirmasi password tidak cocok.");
    } else {
      if (password) {
        if (password.length < 8) return setFormError("Password minimal harus 8 karakter.");
        if (password !== passwordConfirmation) return setFormError("Konfirmasi password tidak cocok.");
      }
    }

    // Validate kecamatan for operator role
    if (roleId === 3 && !kecamatanId) {
      return setFormError("Silakan pilih Kecamatan untuk admin kecamatan (operator).");
    }

    try {
      if (userToEdit) {
        // Edit Mode
        const payload: any = {
          name,
          username,
          role_id: roleId,
          kecamatan_id: roleId === 3 ? parseInt(kecamatanId) : null,
          is_active: isActive,
        };
        if (password) {
          payload.password = password;
          payload.password_confirmation = passwordConfirmation;
        }
        await api.put(`/admin/accounts/${userToEdit.id}`, payload);
        showToast("Pengguna berhasil diperbarui.", "success");
      } else {
        // Create Mode
        const payload = {
          name,
          username,
          password,
          password_confirmation: passwordConfirmation,
          role_id: roleId,
          kecamatan_id: roleId === 3 ? parseInt(kecamatanId) : null,
          is_active: isActive,
        };
        await api.post("/admin/accounts", payload);
        showToast("Pengguna baru berhasil ditambahkan.", "success");
      }
      setUserModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.error || "Gagal menyimpan pengguna.");
    }
  };

  const handleUploadGuideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideTitle.trim()) return showToast("Judul manual book wajib diisi.", "error");
    if (!guideFile) return showToast("Silakan pilih file PDF.", "error");
    if (guideFile.type !== "application/pdf") return showToast("File harus berformat PDF.", "error");
    if (guideFile.size > 10 * 1024 * 1024) return showToast("Ukuran file maksimal 10 MB.", "error");

    setIsUploadingGuide(true);
    const formData = new FormData();
    formData.append("title", guideTitle);
    formData.append("file", guideFile);

    try {
      await api.post("/admin/manual-books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Manual book berhasil diunggah.", "success");
      setGuideTitle("");
      setGuideFile(null);
      // reset file input
      const fileInput = document.getElementById("guide-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      queryClient.invalidateQueries({ queryKey: ["manual-books"] });
    } catch (err: any) {
      showToast(err.response?.data?.message || err.response?.data?.error || "Gagal mengunggah manual book.", "error");
    } finally {
      setIsUploadingGuide(false);
    }
  };

  const handleUpdatePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPasscode || formPasscode.length < 8) {
      return showToast("Password akses form minimal 8 karakter.", "error");
    }
    if (formPasscode !== formPasscodeConfirm) {
      return showToast("Konfirmasi password tidak cocok.", "error");
    }

    setIsUpdatingPasscode(true);
    try {
      await api.patch("/admin/settings/form-password", {
        password: formPasscode,
        password_confirmation: formPasscodeConfirm,
      });
      showToast("Password akses form laporan publik berhasil diperbarui.", "success");
      setFormPasscode("");
      setFormPasscodeConfirm("");
      queryClient.invalidateQueries({ queryKey: ["form-passcode-status"] });
    } catch (err: any) {
      showToast(err.response?.data?.message || err.response?.data?.error || "Gagal mengubah password akses form.", "error");
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  const handleDownloadGuide = async (id: number, filename: string) => {
    try {
      const response = await api.get(`/manual-books/${id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Gagal mengunduh manual book.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-[#f9f9f9] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SipenaNav />
      <NewsTicker />

      <main className="pt-32 pb-16 px-4 max-w-[1200px] mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Panel Administrator</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola akun pengguna, manual book, dan keamanan form.</p>
        </header>

        {/* Responsive Tab Selector for Mobile */}
        <div className="block sm:hidden mb-6 px-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Pilih Menu Halaman</label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            <option value="users">👤 Pengguna Dashboard</option>
            <option value="guides">📖 Panduan Aplikasi (PDF)</option>
            <option value="settings">🔒 Pengamanan Form</option>
          </select>
        </div>

        {/* Tab Controls for Desktop */}
        <div className="hidden sm:block -mx-4 sm:mx-0 mb-6 border-b border-slate-200 px-4 sm:px-0">
          <div className="flex min-w-max gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "users"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
              Pengguna Dashboard
            </button>
            <button
              onClick={() => setActiveTab("guides")}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "guides"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              Panduan Aplikasi (PDF)
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === "settings"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">security</span>
              Pengamanan Form
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-lg font-bold text-slate-800">Daftar Pengguna Dashboard</h2>
              <button
                onClick={handleOpenAddUser}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Tambah Pengguna
              </button>
            </div>

            {isLoadingUsers ? (
              <div className="text-center py-8 text-slate-400">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                Memuat data pengguna...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Belum ada akun pengguna.</div>
            ) : (
              <>
                {/* Tabel (Desktop view) */}
                <div className="hidden md:block -mx-4 sm:mx-0 overflow-x-auto">
              <table className="min-w-[900px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Username</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Hak Akses</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Kecamatan</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 max-w-[180px] truncate" title={u.name}>{u.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{u.username}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase">
                          {u.role === "admin"
                            ? "Admin Kabupaten"
                            : u.role === "pimpinan"
                              ? "Kepala BPBD"
                              : "Admin Kecamatan"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {u.role === "operator" ? u.nama_kecamatan || "-" : "Semua Wilayah"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                        >
                          {u.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            title="Edit Profil Akun"
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleOpenViewUser(u)}
                            title="Lihat Detail & Password"
                            className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-200 transition-all duration-200 hover:bg-emerald-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(5,150,105,0.4)] flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteUserConfirmOpen(true);
                            }}
                            title="Hapus Akun"
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 border border-rose-200 transition-all duration-200 hover:bg-rose-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(225,29,72,0.4)] flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (Mobile view) */}
            <div className="block md:hidden space-y-4 pt-2">
              {users.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((u) => (
                <div
                  key={`user-card-${u.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm break-all">{u.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">{u.username}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-3 border-t border-slate-100 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Hak Akses</span>
                      <span className="font-bold text-slate-700 uppercase">
                        {u.role === "admin"
                          ? "Admin Kabupaten"
                          : u.role === "pimpinan"
                            ? "Kepala BPBD"
                            : "Admin Kecamatan"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Wilayah</span>
                      <span className="font-bold text-slate-700">
                        {u.role === "operator" ? u.nama_kecamatan || "-" : "Semua Wilayah"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditUser(u)}
                      className="w-full py-1.5 rounded-lg text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenViewUser(u)}
                      className="w-full py-1.5 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Detail
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(u);
                        setDeleteUserConfirmOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

          {/* Pagination Controls */}
          {!isLoadingUsers && users.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-slate-100 px-1 gap-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                  <span className="text-xs text-slate-500 font-semibold">data</span>
                </div>
                <div className="text-xs text-slate-500 font-semibold text-center sm:text-left">
                  Menampilkan {Math.min((currentPage - 1) * pageSize + 1, users.length)}-{Math.min(currentPage * pageSize, users.length)} dari {users.length} pengguna
                </div>
              </div>
              <div className="flex items-center gap-1 justify-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                {Array.from({ length: Math.ceil(users.length / pageSize) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                      currentPage === p
                        ? "bg-amber-500 text-white border border-amber-500 shadow-sm shadow-amber-500/25"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage === Math.ceil(users.length / pageSize) || Math.ceil(users.length / pageSize) === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "guides" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Box */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 h-fit">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">upload_file</span>
                Unggah Manual Book
              </h2>
              <form onSubmit={handleUploadGuideSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Judul Panduan</label>
                  <input
                    type="text"
                    className="border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Contoh: Panduan Admin Kecamatan"
                    value={guideTitle}
                    onChange={(e) => setGuideTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">File PDF</label>
                  <input
                    id="guide-file-input"
                    type="file"
                    accept=".pdf"
                    className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 file:bg-slate-100 file:border-0 file:rounded-md file:text-xs file:font-semibold file:px-3 file:py-1.5 file:mr-3 file:text-slate-600 file:hover:bg-slate-200 file:cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setGuideFile(e.target.files[0]);
                      }
                    }}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Maksimal ukuran file PDF: 10 MB.</p>
                </div>
                <button
                  type="submit"
                  disabled={isUploadingGuide}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isUploadingGuide ? "hourglass_top" : "cloud_upload"}
                  </span>
                  {isUploadingGuide ? "Mengunggah..." : "Unggah File PDF"}
                </button>
              </form>
            </div>

            {/* List Guides */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">menu_book</span>
                Manual Book Terdaftar
              </h2>
              {isLoadingGuides ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="animate-spin w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                  Memuat manual book...
                </div>
              ) : guides.length === 0 ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">find_in_page</span>
                  <p>Belum ada manual book yang diunggah.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {guides.map((g) => (
                    <div
                      key={g.id}
                      className="border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="bg-red-50 text-red-500 p-2.5 rounded-lg flex-shrink-0">
                          <span className="material-symbols-outlined text-2xl block">picture_as_pdf</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-700 text-sm break-words">{g.title}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">
                            {g.file_name} ({formatSize(g.file_size)})
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Diunggah oleh: <strong>{g.uploaded_by_name || "Admin"}</strong> —{" "}
                            {new Date(g.created_at).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end flex-shrink-0">
                        <button
                          onClick={() => handleDownloadGuide(g.id, g.file_name)}
                          title="Unduh PDF"
                          className="p-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg transition-all duration-200 hover:bg-emerald-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(5,150,105,0.4)] flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button
                          onClick={() => {
                            setGuideToDelete(g);
                            setDeleteGuideConfirmOpen(true);
                          }}
                          title="Hapus"
                          className="p-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg transition-all duration-200 hover:bg-rose-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(225,29,72,0.4)] flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 max-w-[600px] mx-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="material-symbols-outlined text-amber-500">lock_open</span>
              Pengamanan Form Laporan
            </h2>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 flex items-start gap-3 border border-slate-100 mt-4">
              <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
              <div>
                <h4 className="text-sm font-bold text-slate-700">Password Gate Form Publik</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Formulir laporan kejadian bencana publik diakses melalui route <strong>/lapor</strong>.
                  Untuk membuka form tersebut, pelapor / anggota TRC wajib memasukkan password gate ini.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500">Status Password Saat Ini:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${passcodeStatus?.is_set
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                      }`}
                  >
                    {passcodeStatus?.is_set ? "Aktif (Sudah Diatur)" : "Belum Diatur (Default)"}
                  </span>
                </div>
                {passcodeStatus?.password_plain && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5 w-fit break-all animate-fade-in">
                    <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0">vpn_key</span>
                    <span className="text-xs font-semibold text-slate-600 flex-shrink-0">Password Aktif:</span>
                    <span className="text-xs font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 break-all">
                      {passcodeStatus.password_plain}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdatePasscodeSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Password Baru Form</label>
                <input
                  type="password"
                  className="border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Masukkan password baru (minimal 8 karakter)"
                  value={formPasscode}
                  onChange={(e) => setFormPasscode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  className="border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Masukkan ulang password baru"
                  value={formPasscodeConfirm}
                  onChange={(e) => setFormPasscodeConfirm(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPasscode}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isUpdatingPasscode ? "hourglass_top" : "save"}
                </span>
                {isUpdatingPasscode ? "Menyimpan..." : "Perbarui Password Form"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: TAMBAH / EDIT PENGGUNA */}
      {userModalOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-[500px] max-h-[90vh] overflow-y-auto animate-fade-in">
            <header className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base">
                {userToEdit ? "Edit Pengguna Dashboard" : "Tambah Pengguna Baru"}
              </h3>
              <button
                onClick={handleCloseUserModal}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined block text-[22px]">close</span>
              </button>
            </header>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {/* Form Validation Error Banner */}
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3 flex items-start gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0">error</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Contoh: Hendri Saputra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">Minimal 3 karakter, maksimal 120 karakter.</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Username (Login)</label>
                <input
                  type="text"
                  required
                  className="border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                  placeholder="Contoh: hendri_operator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">Minimal 3 karakter, maksimal 50 karakter.</p>
              </div>

              {/* Password inputs with Visibility Toggle */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {userToEdit ? "Password Baru (Opsional)" : "Password"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!userToEdit}
                    className="w-full border border-slate-200 rounded-lg p-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder={userToEdit ? "Kosongkan jika tidak ingin mengubah password" : "Password login akun (min 8 karakter)"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Minimal 8 karakter.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {userToEdit ? "Konfirmasi Password Baru (Opsional)" : "Konfirmasi Password"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    required={!userToEdit}
                    className="w-full border border-slate-200 rounded-lg p-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder={userToEdit ? "Ulangi jika ingin mengubah password" : "Ulangi password login"}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPasswordConfirm ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Hak Akses (Role)</label>
                <select
                  className="border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-400 h-10"
                  value={roleId}
                  onChange={(e) => setRoleId(parseInt(e.target.value))}
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kecamatan selector only for operator (roleId === 3) */}
              {roleId === 3 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kecamatan Tugas</label>
                  <select
                    required
                    className="border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-amber-400 h-10"
                    value={kecamatanId}
                    onChange={(e) => setKecamatanId(e.target.value)}
                  >
                    <option value="">Pilih Kecamatan...</option>
                    {kecamatans.map((k: any) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kecamatan}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-400"
                  checked={isActive}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked && userToEdit) {
                      setDeactivateWarningOpen(true);
                    } else if (!checked && !userToEdit) {
                      setIsActive(false);
                    } else {
                      setIsActive(true);
                    }
                  }}
                />
                <label htmlFor="active-checkbox" className="text-sm text-slate-700 font-semibold select-none">
                  Akun Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseUserModal}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  {userToEdit ? "Simpan Perubahan" : "Buat Akun Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PENGGUNA */}
      {viewModalOpen && userToView && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-[450px] max-h-[90vh] overflow-y-auto animate-fade-in">
            <header className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined">visibility</span> Detail Pengguna
              </h3>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined block text-[22px]">close</span>
              </button>
            </header>
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</span>
                <span className="sm:col-span-2 text-sm font-semibold text-slate-800 break-all">{userToView.name}</span>
              </div>
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Username</span>
                <span className="sm:col-span-2 text-sm font-mono text-slate-700 break-all">{userToView.username}</span>
              </div>
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Hak Akses</span>
                <span className="sm:col-span-2 text-sm">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase">
                    {userToView.role === "admin"
                      ? "Admin Kabupaten"
                      : userToView.role === "pimpinan"
                        ? "Kepala BPBD"
                        : "Admin Kecamatan"}
                  </span>
                </span>
              </div>
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Wilayah Tugas</span>
                <span className="sm:col-span-2 text-sm text-slate-700 break-all">
                  {userToView.role === "operator" ? userToView.nama_kecamatan || "-" : "Semua Wilayah"}
                </span>
              </div>
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Status Akun</span>
                <span className="sm:col-span-2 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${userToView.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {userToView.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </span>
              </div>
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 py-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Password Aktif</span>
                <span className="sm:col-span-2 text-sm font-mono font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 w-fit break-all">
                  {userToView.password_plain || "(Password Terenkripsi)"}
                </span>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WARNING BATAL */}
      {cancelWarningOpen && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500 animate-bounce">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h4 className="text-base font-bold text-slate-800">Apakah Anda Yakin?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ada perubahan data yang belum disimpan. Jika Anda membatalkan, data yang telah diisi akan hilang.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelWarningOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Kembali Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancelWarningOpen(false);
                    setUserModalOpen(false);
                    setFormError(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WARNING NONAKTIFKAN */}
      {deactivateWarningOpen && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500">
                <span className="material-symbols-outlined text-2xl">no_accounts</span>
              </div>
              <h4 className="text-base font-bold text-slate-800">Nonaktifkan Akun?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Menonaktifkan akun akan memblokir akses login pengguna ini ke Dashboard SiPENA. Apakah Anda yakin?
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeactivateWarningOpen(false);
                    setIsActive(true);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeactivateWarningOpen(false);
                    setIsActive(false);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
                >
                  Ya, Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM HAPUS USER */}
      {deleteUserConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500">
                <span className="material-symbols-outlined text-2xl">person_remove</span>
              </div>
              <h4 className="text-base font-bold text-slate-800">Hapus Pengguna?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun pengguna <strong>{userToDelete.name}</strong> secara permanen? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteUserConfirmOpen(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteUserConfirmOpen(false);
                    deleteUserMutation.mutate(userToDelete.id);
                    setUserToDelete(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM HAPUS PANDUAN */}
      {deleteGuideConfirmOpen && guideToDelete && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500">
                <span className="material-symbols-outlined text-2xl">delete</span>
              </div>
              <h4 className="text-base font-bold text-slate-800">Hapus Manual Book?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus manual book <strong>{guideToDelete.title}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteGuideConfirmOpen(false);
                    setGuideToDelete(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteGuideConfirmOpen(false);
                    deleteGuideMutation.mutate(guideToDelete.id);
                    setGuideToDelete(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[2000] px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 animate-fade-in ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold" 
            : "bg-rose-50 border-rose-200 text-rose-700 font-semibold"
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-xs">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
