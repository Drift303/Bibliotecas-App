import { useEffect, useState } from "react";
import api from "../api";
import { useTheme } from "../context/ThemeContext";
import LogoutButton from "../components/LogoutButton";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";
import { Plus, X, Copy, Check, AlertCircle, UserPlus, HelpCircle, ChevronDown } from "lucide-react";

interface School {
  id: string;
  name: string;
  emailDomain: string;
  status: "ACTIVE" | "SUSPENDED";
}

interface TempPasswordModal {
  schoolName: string;
  librarianName: string;
  email: string;
  tempPassword: string;
}

export default function Schools() {
  const { isDark } = useTheme();
  const userName = localStorage.getItem("userName") || "Administrador";
  const ownTenantId = localStorage.getItem("tenantId");

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");

  const [showNewSchool, setShowNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolDomain, setNewSchoolDomain] = useState("");
  const [newSchoolError, setNewSchoolError] = useState("");
  const [savingSchool, setSavingSchool] = useState(false);

  const [librarianTargetId, setLibrarianTargetId] = useState<string | null>(null);
  const [librarianName, setLibrarianName] = useState("");
  const [librarianEmail, setLibrarianEmail] = useState("");
  const [librarianError, setLibrarianError] = useState("");
  const [savingLibrarian, setSavingLibrarian] = useState(false);

  const [tempPasswordModal, setTempPasswordModal] = useState<TempPasswordModal | null>(null);
  const [copied, setCopied] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenants");
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setSchools(list);
      setStatusType("ok");
      setStatusMessage(
        list.length > 0 ? "Datos sincronizados desde el servidor." : "Conectado. No hay planteles registrados."
      );
    } catch (err) {
      setSchools([]);
      setStatusType("error");
      setStatusMessage("Sin conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const resetNewSchoolForm = () => {
    setNewSchoolName("");
    setNewSchoolDomain("");
    setNewSchoolError("");
  };

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim() || !newSchoolDomain.trim()) {
      setNewSchoolError("Completa el nombre y el dominio.");
      return;
    }
    setNewSchoolError("");
    setSavingSchool(true);
    try {
      await api.post("/tenants", { name: newSchoolName.trim(), emailDomain: newSchoolDomain.trim() });
      setShowNewSchool(false);
      resetNewSchoolForm();
      await loadSchools();
    } catch (err: any) {
      const message = err?.response?.data?.error || "";
      if (message.includes("dominio")) {
        setNewSchoolError("Ese dominio ya está registrado.");
      } else if (message.includes("dominio inválido") || message.toLowerCase().includes("invalid")) {
        setNewSchoolError("El formato del dominio no es válido.");
      } else {
        setNewSchoolError("No se pudo crear el plantel.");
      }
    } finally {
      setSavingSchool(false);
    }
  };

  const openLibrarianModal = (schoolId: string) => {
    setLibrarianTargetId(schoolId);
    setLibrarianName("");
    setLibrarianEmail("");
    setLibrarianError("");
  };

  const handleCreateLibrarian = async () => {
    if (!librarianTargetId) return;
    if (!librarianName.trim() || !librarianEmail.trim()) {
      setLibrarianError("Completa nombre y correo.");
      return;
    }
    setLibrarianError("");
    setSavingLibrarian(true);
    try {
      const res = await api.post(`/tenants/${librarianTargetId}/librarian`, {
        name: librarianName.trim(),
        email: librarianEmail.trim(),
      });
      const created = res.data.data;
      const school = schools.find((s) => s.id === librarianTargetId);

      if (created?.tempPassword) {
        setTempPasswordModal({
          schoolName: school?.name || "",
          librarianName: created.name,
          email: created.email,
          tempPassword: created.tempPassword,
        });
      }
      setLibrarianTargetId(null);
    } catch (err: any) {
      const message = err?.response?.data?.error || "";
      if (message.includes("email")) {
        setLibrarianError("Ese correo ya existe en el plantel.");
      } else {
        setLibrarianError("No se pudo crear el bibliotecario.");
      }
    } finally {
      setSavingLibrarian(false);
    }
  };

  const handleToggleStatus = async (school: School) => {
    const nextStatus = school.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setTogglingId(school.id);
    try {
      await api.patch(`/tenants/${school.id}/status`, { status: nextStatus });
      await loadSchools();
    } catch (err: any) {
      const message = err?.response?.data?.error || "No se pudo actualizar el estado del plantel.";
      setStatusType("error");
      setStatusMessage(message);
    } finally {
      setTogglingId(null);
    }
  };

  // Tokens de color planos, sin gradiente — estética tipo macOS System Settings
  const bg = isDark ? "bg-[#1C1C1E]" : "bg-[#F5F5F7]";
  const surface = isDark ? "bg-[#2C2C2E]" : "bg-white";
  const border = isDark ? "border-[#38383A]" : "border-[#D2D2D7]";
  const textPrimary = isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]";
  const textSecondary = isDark ? "text-[#8E8E93]" : "text-[#6E6E73]";
  const rowHover = isDark ? "hover:bg-[#3A3A3C]" : "hover:bg-[#FAFAFA]";

  const flatButton = `px-3.5 py-1.5 rounded-md text-sm font-medium border transition-colors ${border} ${textPrimary} ${
    isDark ? "hover:bg-[#3A3A3C]" : "hover:bg-[#F0F0F2]"
  }`;

  const primaryButton = `flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium border transition-colors ${
    isDark ? "border-[#0A84FF] text-[#0A84FF] hover:bg-[#0A84FF]/10" : "border-[#0071E3] text-[#0071E3] hover:bg-[#0071E3]/5"
  }`;

  const inputClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors ${border} ${
    isDark ? "bg-[#1C1C1E] text-white placeholder-[#6E6E73] focus:border-[#0A84FF]" : "bg-white text-[#1D1D1F] placeholder-[#A1A1A6] focus:border-[#0071E3]"
  } focus:outline-none`;

  return (
    <div className={`min-h-screen p-6 md:p-10 transition-colors ${bg} ${textPrimary}`}>
      {/* Encabezado */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planteles</h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            Sesión iniciada como <span className="font-medium">{userName}</span>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <ThemeToggleButton />
          <button onClick={() => setShowNewSchool(true)} className={primaryButton}>
            <Plus size={16} /> Nuevo plantel
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* Mensaje de estado — nunca datos falsos, siempre reflejo real del servidor */}
      {statusMessage && (
        <p className={`text-sm mb-4 flex items-center gap-1.5 ${statusType === "error" ? "text-[#FF3B30]" : textSecondary}`}>
          {statusType === "error" && <AlertCircle size={14} />}
          {statusMessage}
        </p>
      )}

      {/* Panel de reglas — plegable, no estorba si no se necesita */}
      <div className={`rounded-lg border mb-4 ${surface} ${border}`}>
        <button
          onClick={() => setShowRules(!showRules)}
          className={`w-full flex items-center justify-between px-5 py-3 text-sm font-medium ${textPrimary}`}
        >
          <span className="flex items-center gap-2">
            <HelpCircle size={16} className={textSecondary} />
            Reglas y validaciones
          </span>
          <ChevronDown
            size={16}
            className={`${textSecondary} transition-transform ${showRules ? "rotate-180" : ""}`}
          />
        </button>

        {showRules && (
          <div className={`px-5 pb-5 pt-1 border-t ${border} grid md:grid-cols-2 gap-6 text-sm`}>
            <div>
              <p className={`font-medium mb-2 ${textPrimary}`}>Crear plantel</p>
              <ul className={`space-y-1.5 ${textSecondary}`}>
                <li>· <span className={textPrimary}>Nombre:</span> el nombre visible del plantel, sin restricción de formato.</li>
                <li>· <span className={textPrimary}>Dominio:</span> debe tener formato de dominio real (ej. <code>escuela.edu.mx</code>).</li>
                <li>· El dominio debe ser único — no puede repetirse entre planteles.</li>
                <li>· El plantel se crea siempre en estado <span className={textPrimary}>Activo</span>.</li>
              </ul>
            </div>
            <div>
              <p className={`font-medium mb-2 ${textPrimary}`}>Agregar bibliotecario</p>
              <ul className={`space-y-1.5 ${textSecondary}`}>
                <li>· <span className={textPrimary}>Nombre y correo</span> son obligatorios.</li>
                <li>· El correo debe ser único dentro de ese plantel.</li>
                <li>· Si no se define contraseña, se genera una temporal y se muestra <span className={textPrimary}>una sola vez</span>.</li>
                <li>· Se envía por correo al bibliotecario (requiere que Brevo esté configurado).</li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <p className={`font-medium mb-2 ${textPrimary}`}>Suspender / activar</p>
              <ul className={`space-y-1.5 ${textSecondary}`}>
                <li>· Un plantel suspendido bloquea el inicio de sesión de todos sus usuarios (bibliotecarios y alumnos).</li>
                <li>· No puedes suspender el plantel al que pertenece tu propia cuenta de superadmin.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className={`rounded-lg border overflow-hidden ${surface} ${border}`}>
        <table className="w-full text-sm text-left">
          <thead className={`${textSecondary} text-xs uppercase tracking-wide border-b ${border}`}>
            <tr>
              <th className="px-5 py-3 font-medium">Plantel</th>
              <th className="px-5 py-3 font-medium">Dominio</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${border}`}>
            {loading ? (
              <tr>
                <td colSpan={4} className={`px-5 py-8 text-center ${textSecondary}`}>
                  Cargando planteles...
                </td>
              </tr>
            ) : schools.length === 0 ? (
              <tr>
                <td colSpan={4} className={`px-5 py-8 text-center ${textSecondary}`}>
                  No hay planteles registrados.
                </td>
              </tr>
            ) : (
              schools.map((school) => {
                const isActive = school.status === "ACTIVE";
                const isOwn = school.id === ownTenantId;
                return (
                  <tr key={school.id} className={`${rowHover} transition-colors`}>
                    <td className="px-5 py-3.5 font-medium">{school.name}</td>
                    <td className={`px-5 py-3.5 ${textSecondary}`}>{school.emailDomain}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${isActive ? "bg-[#34C759]" : "bg-[#FF3B30]"}`}
                        />
                        {isActive ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openLibrarianModal(school.id)}
                          className={`p-1.5 rounded-md transition-colors ${textSecondary} ${
                            isDark ? "hover:bg-[#3A3A3C] hover:text-white" : "hover:bg-[#F0F0F2] hover:text-[#1D1D1F]"
                          }`}
                          title="Agregar bibliotecario"
                        >
                          <UserPlus size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(school)}
                          disabled={isOwn || togglingId === school.id}
                          title={isOwn ? "No puedes suspender tu propio plantel" : undefined}
                          className={`${flatButton} ${isOwn ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          {togglingId === school.id ? "..." : isActive ? "Suspender" : "Activar"}
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

      {/* Modal: nuevo plantel */}
      {showNewSchool && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className={`rounded-lg w-full max-w-sm p-5 border ${surface} ${border}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Nuevo plantel</h2>
              <button onClick={() => setShowNewSchool(false)} className={textSecondary}>
                <X size={18} />
              </button>
            </div>

            {newSchoolError && (
              <p className="text-sm text-[#FF3B30] mb-3 flex items-center gap-1.5">
                <AlertCircle size={14} /> {newSchoolError}
              </p>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del plantel"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Dominio de correo (ej. escuela.edu.mx)"
                value={newSchoolDomain}
                onChange={(e) => setNewSchoolDomain(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={handleCreateSchool} disabled={savingSchool} className={primaryButton}>
                {savingSchool ? "Creando..." : "Crear plantel"}
              </button>
              <button onClick={() => setShowNewSchool(false)} className={flatButton}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: nuevo bibliotecario */}
      {librarianTargetId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className={`rounded-lg w-full max-w-sm p-5 border ${surface} ${border}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Nuevo bibliotecario</h2>
              <button onClick={() => setLibrarianTargetId(null)} className={textSecondary}>
                <X size={18} />
              </button>
            </div>

            {librarianError && (
              <p className="text-sm text-[#FF3B30] mb-3 flex items-center gap-1.5">
                <AlertCircle size={14} /> {librarianError}
              </p>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo"
                value={librarianName}
                onChange={(e) => setLibrarianName(e.target.value)}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Correo"
                value={librarianEmail}
                onChange={(e) => setLibrarianEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={handleCreateLibrarian} disabled={savingLibrarian} className={primaryButton}>
                {savingLibrarian ? "Creando..." : "Crear bibliotecario"}
              </button>
              <button onClick={() => setLibrarianTargetId(null)} className={flatButton}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: contraseña temporal — mismo patrón que Students.tsx */}
      {tempPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className={`rounded-lg w-full max-w-sm p-5 border ${surface} ${border}`}>
            <h2 className="text-base font-semibold mb-2">Contraseña temporal</h2>
            <p className="text-sm text-[#FF3B30] mb-4 flex items-start gap-1.5">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              Esta es la única vez que verás esta contraseña. Anótala o compártela ahora.
            </p>
            <p className={`text-sm mb-1 ${textSecondary}`}>
              <span className={textPrimary}>Plantel:</span> {tempPasswordModal.schoolName}
            </p>
            <p className={`text-sm mb-1 ${textSecondary}`}>
              <span className={textPrimary}>Bibliotecario:</span> {tempPasswordModal.librarianName}
            </p>
            <p className={`text-sm mb-4 ${textSecondary}`}>
              <span className={textPrimary}>Correo:</span> {tempPasswordModal.email}
            </p>
            <div className={`rounded-md p-3 text-center font-mono text-lg tracking-wide mb-4 border ${border} ${isDark ? "bg-[#1C1C1E]" : "bg-[#F5F5F7]"}`}>
              {tempPasswordModal.tempPassword}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPasswordModal.tempPassword);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={primaryButton}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
              <button onClick={() => setTempPasswordModal(null)} className={flatButton}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}