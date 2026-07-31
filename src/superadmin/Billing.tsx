import { useEffect, useState } from "react";
import api from "../api";
import { useTheme } from "../context/ThemeContext";
import LogoutButton from "../components/LogoutButton";
import { ThemeToggleButton } from "../components/ui/ThemeToggleButton";
import { AlertCircle, X, ExternalLink, Copy, Check } from "lucide-react";

type BillingCycle = "MONTHLY" | "SEMESTER" | "ANNUAL";

interface TenantBilling {
  id: string;
  name: string;
  billingCycle: BillingCycle;
  planExpiresAt: string | null;
}

interface CycleInfo {
  label: string;
  months: number;
  discount: number;
}

interface CheckoutResult {
  tenantName: string;
  initPoint: string;
  sandboxInitPoint: string;
  total: number;
}

export default function Billing() {
  const { isDark } = useTheme();
  const userName = localStorage.getItem("userName") || "Administrador";

  const [tenants, setTenants] = useState<TenantBilling[]>([]);
  const [monthlyPrice, setMonthlyPrice] = useState<number>(0);
  const [cycles, setCycles] = useState<Record<string, CycleInfo>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [checkoutTargetId, setCheckoutTargetId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("MONTHLY");
  const [generatingCheckout, setGeneratingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        api.get("/tenants"),
        api.get("/billing/plans"),
      ]);
      setTenants(Array.isArray(tenantsRes.data.data) ? tenantsRes.data.data : []);
      setMonthlyPrice(plansRes.data.data.monthlyPrice || 0);
      setCycles(plansRes.data.data.cycles || {});
    } catch (err) {
      setErrorMessage("No se pudo cargar la información de facturación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCheckoutModal = (tenantId: string) => {
    setCheckoutTargetId(tenantId);
    setSelectedCycle("MONTHLY");
    setCheckoutError("");
    setCheckoutResult(null);
  };

  const handleGenerateCheckout = async () => {
    if (!checkoutTargetId) return;
    setGeneratingCheckout(true);
    setCheckoutError("");
    try {
      const res = await api.post(`/billing/${checkoutTargetId}/checkout`, {
        cycle: selectedCycle,
      });
      const tenant = tenants.find((t) => t.id === checkoutTargetId);
      setCheckoutResult({
        tenantName: tenant?.name || "",
        initPoint: res.data.data.initPoint,
        sandboxInitPoint: res.data.data.sandboxInitPoint,
        total: res.data.data.total,
      });
    } catch (err: any) {
      setCheckoutError(err?.response?.data?.error || "No se pudo generar el link de cobro.");
    } finally {
      setGeneratingCheckout(false);
    }
  };

  // Estado del plan según planExpiresAt: sin fecha = nunca ha pagado,
  // vencido = ya pasó la fecha, activo = sigue vigente.
  const planStatus = (planExpiresAt: string | null) => {
    if (!planExpiresAt) return { label: "Sin pago registrado", color: "#8E8E93" };
    const expires = new Date(planExpiresAt);
    if (expires < new Date()) return { label: "Vencido", color: "#FF3B30" };
    return { label: "Activo", color: "#34C759" };
  };

  const estimatedTotal = cycles[selectedCycle]
    ? Math.round(monthlyPrice * cycles[selectedCycle].months * (1 - cycles[selectedCycle].discount) * 100) / 100
    : null;

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
  const selectClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors ${border} ${
    isDark ? "bg-[#1C1C1E] text-white" : "bg-white text-[#1D1D1F]"
  } focus:outline-none`;

  return (
    <div className={`min-h-screen p-6 md:p-10 transition-colors ${bg} ${textPrimary}`}>
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            Sesión iniciada como <span className="font-medium">{userName}</span>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <ThemeToggleButton />
          <LogoutButton />
        </div>
      </div>

      <p className={`text-xs mb-4 ${textSecondary}`}>
        Los cobros se procesan con Mercado Pago. Mientras se usen credenciales de prueba
        (sandbox), los pagos no son reales.
      </p>

      {errorMessage && (
        <p className="text-sm text-[#FF3B30] mb-4 flex items-center gap-1.5">
          <AlertCircle size={14} /> {errorMessage}
        </p>
      )}

      <div className={`rounded-lg border overflow-hidden ${surface} ${border}`}>
        <table className="w-full text-sm text-left">
          <thead className={`${textSecondary} text-xs uppercase tracking-wide border-b ${border}`}>
            <tr>
              <th className="px-5 py-3 font-medium">Plantel</th>
              <th className="px-5 py-3 font-medium">Ciclo</th>
              <th className="px-5 py-3 font-medium">Vence</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${border}`}>
            {loading ? (
              <tr>
                <td colSpan={5} className={`px-5 py-8 text-center ${textSecondary}`}>
                  Cargando...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={5} className={`px-5 py-8 text-center ${textSecondary}`}>
                  No hay planteles registrados.
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => {
                const status = planStatus(tenant.planExpiresAt);
                return (
                  <tr key={tenant.id} className={`${rowHover} transition-colors`}>
                    <td className="px-5 py-3.5 font-medium">{tenant.name}</td>
                    <td className={`px-5 py-3.5 ${textSecondary}`}>
                      {cycles[tenant.billingCycle]?.label || tenant.billingCycle}
                    </td>
                    <td className={`px-5 py-3.5 ${textSecondary}`}>
                      {tenant.planExpiresAt ? new Date(tenant.planExpiresAt).toLocaleDateString("es-MX") : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openCheckoutModal(tenant.id)} className={primaryButton}>
                        Generar cobro
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: generar cobro */}
      {checkoutTargetId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className={`rounded-lg w-full max-w-sm p-5 border ${surface} ${border}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Generar cobro</h2>
              <button onClick={() => setCheckoutTargetId(null)} className={textSecondary}>
                <X size={18} />
              </button>
            </div>

            {checkoutError && (
              <p className="text-sm text-[#FF3B30] mb-3 flex items-center gap-1.5">
                <AlertCircle size={14} /> {checkoutError}
              </p>
            )}

            {!checkoutResult ? (
              <>
                <div className="space-y-3">
                  <p className={`text-sm ${textSecondary}`}>
                    Precio base: <span className={textPrimary}>${monthlyPrice} MXN/mes</span>
                  </p>
                  <div>
                    <p className={`text-xs font-medium mb-1.5 ${textSecondary}`}>Ciclo de pago</p>
                    <select
                      value={selectedCycle}
                      onChange={(e) => setSelectedCycle(e.target.value as BillingCycle)}
                      className={selectClass}
                    >
                      {Object.entries(cycles).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label}
                          {info.discount > 0 ? ` (-${info.discount * 100}%)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {estimatedTotal !== null && (
                    <p className={`text-sm ${textPrimary}`}>
                      Total a cobrar: <span className="font-semibold">${estimatedTotal} MXN</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={handleGenerateCheckout} disabled={generatingCheckout} className={primaryButton}>
                    {generatingCheckout ? "Generando..." : "Generar link de pago"}
                  </button>
                  <button onClick={() => setCheckoutTargetId(null)} className={flatButton}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={`text-sm mb-3 ${textSecondary}`}>
                  Link de pago (sandbox) para <span className={textPrimary}>{checkoutResult.tenantName}</span> — total ${checkoutResult.total} MXN
                </p>
                <div className="flex gap-2 mb-4">
                  <a
                    href={checkoutResult.sandboxInitPoint || checkoutResult.initPoint}
                    target="_blank"
                    rel="noreferrer"
                    className={`${primaryButton} flex-1 justify-center`}
                  >
                    <ExternalLink size={14} /> Abrir checkout de prueba
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(checkoutResult.sandboxInitPoint || checkoutResult.initPoint);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={flatButton}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    setCheckoutTargetId(null);
                    setCheckoutResult(null);
                    await load();
                  }}
                  className={flatButton}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
