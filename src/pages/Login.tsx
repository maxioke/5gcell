import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  User,
  Building2,
  Loader2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Smartphone,
  Sparkles,
  ArrowRight,
  BarChart3,
  Globe2,
  Headphones,
  KeyRound,
  Wrench,
  Activity,
  Layers,
} from "lucide-react";

import { supabase } from "../lib/supabase";

// --- SUB-COMPONENTES AUXILIARES DE DISEÑO ---

/**
 * Indicador badge de estado del sistema
 */
function SystemStatusBadge() {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 backdrop-blur-md">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
      </span>
      <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
        Sistema Online v2.5
      </span>
    </div>
  );
}

/**
 * Feature Card para la columna izquierda
 */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

function FeatureCard({ icon, title, description, badge }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 hover:bg-white/[0.06] hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)]">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        {badge && (
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-bold text-white transition-colors duration-200 group-hover:text-cyan-200">
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}

/**
 * Stat Item Banner
 */
interface StatProps {
  value: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

function StatBox({ value, label, sublabel, icon }: StatProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30">
      <div className="flex items-center justify-between text-cyan-400">
        {icon}
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          {sublabel}
        </span>
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium text-slate-400">{label}</div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setMessageType("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  }

  async function handleRegister() {
    if (!businessName.trim()) {
      setMessage("Ingrese el nombre del taller.");
      setMessageType("error");
      return;
    }

    if (!ownerName.trim()) {
      setMessage("Ingrese el nombre del propietario.");
      setMessageType("error");
      return;
    }

    if (!phone.trim()) {
      setMessage("Ingrese el teléfono.");
      setMessageType("error");
      return;
    }

    if (!email.trim()) {
      setMessage("Ingrese un correo.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("La contraseña debe tener mínimo 6 caracteres.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setMessageType("error");
      return;
    }

    setMessage("");
    setMessageType("");
    setLoading(true);

  // Enviar datos en options.data para activar Triggers de base de datos
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/confirm-success`,
      data: {
        full_name: ownerName,
        business_name: businessName,
        phone: phone,
      },
    },
  });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      setMessageType("error");
      return;
    }

    // Insert explícito en la tabla profiles para alinearse a la tabla de base de datos
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          business_name: businessName,
          full_name: ownerName,
          phone: phone,
        });

      if (profileError) {
        setLoading(false);
        setMessage(profileError.message);
        setMessageType("error");
        return;
      }
    }

    setLoading(false);
    setMessage("Cuenta creada correctamente.");
    setMessageType("success");
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setMessage("Primero ingresa tu correo electrónico.");
      setMessageType("error");
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    setResetLoading(false);

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      return;
    }

    setMessage("Te enviamos un correo para restablecer tu contraseña.");
    setMessageType("success");
  }

  // Estilo reutilizable para los inputs
  const inputClass =
    "w-full h-14 rounded-2xl border border-white/10 bg-slate-950/60 pl-12 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300 hover:border-cyan-500/40 focus:border-cyan-400 focus:bg-slate-950/90 focus:ring-4 focus:ring-cyan-500/20";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030712] font-sans selection:bg-cyan-500 selection:text-white">
      {/* ------------------------------------------------------------------- */}
      {/* CAPA DE AMBIENTE Y LUCES FLOTANTES                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-600/20 blur-[160px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-700/20 blur-[160px] animate-pulse [animation-delay:3s]" />
        <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[180px]" />

        {/* Cyber Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* CONTENEDOR ESTRUCTURAL CENTRAL                                     */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="relative w-full max-w-7xl overflow-hidden rounded-[40px] border border-white/15 bg-slate-900/40 backdrop-blur-3xl shadow-[0_35px_120px_rgba(0,0,0,0.8)]">
          
          {/* Borde Neón Glow Superior */}
          <div className="absolute top-0 left-20 right-20 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]" />

          <div className="grid min-h-[780px] lg:grid-cols-12">
            
            {/* =============================================================== */}
            {/* SECCIÓN IZQUIERDA: BRANDING, STATS Y CARACTERÍSTICAS (7 COLS)   */}
            {/* =============================================================== */}
            <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#061121] via-[#08162b] to-[#040914] p-10 lg:col-span-7 lg:flex lg:flex-col lg:justify-between xl:p-14">
              
              {/* Luces Ambientales Internas */}
              <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-cyan-500/15 blur-[120px]" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/15 blur-[140px]" />

              {/* HEADER DE MARCA Y BADGE */}
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  {/* LOGO BRANDING */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 rounded-2x3 bg-gradient-to-r from-cyan-500 to-blue-600 blur opacity-70 group-hover:opacity-100 transition duration-300" />
                      <div className="relative flex h-30 w-40 items-center justify-center rounded-2xl border border-white/20 bg-slate-950/80 shadow-2xl backdrop-blur-xl p-1">
                      <img src="/logo.png" alt="Logo Taller" className="h-40 w-40 object-contain scale-200" /></div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-black tracking-widest text-white">
                        5G CELL
                      </h1>
                      <p className="text-[10px] font-bold tracking-[0.4em] text-cyan-400 uppercase">
                        COMUNICACIONES
                      </p>
                    </div>
                  </div>

                  <SystemStatusBadge />
                </div>

                {/* TITULAR Y DESCRIPCIÓN */}
                <div className="mt-14">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-1 text-xs font-medium text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                    Plataforma Cloud de Gestión Profesional
                  </div>

                  <h2 className="mt-6 text-4xl font-black leading-[1.15] text-white xl:text-5xl">
                    El software completo <br />
                    <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                      para 5GCELL
                    </span>
                    <br />
                    
                  </h2>

                  <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300">
                    Optimiza la recepción de equipos, control de inventario,
                    notificaciones a clientes, facturación y estados técnicos en
                    tiempo real desde una única interfaz intuitiva.
                  </p>
                </div>
              </div>

              {/* GRID DE CARACTERÍSTICAS TÉCNICAS */}
              <div className="relative z-10 my-8 grid grid-cols-2 gap-4">
                <FeatureCard
                  icon={<Wrench className="h-6 w-6" />}
                  title="Gestión de Órdenes"
                  description="Flujo de trabajo para diagnósticos, presupuestos y entregas rápidas."
                  badge="Rápido"
                />
                <FeatureCard
                  icon={<BarChart3 className="h-6 w-6" />}
                  title="Métricas en Vivo"
                  description="Reportes detallados de ingresos, ganancias e historial de clientes."
                  badge="Cloud"
                />
              </div>

              {/* METROLOGÍA Y ESTADÍSTICAS */}
              <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
                <StatBox
                  value="+1,500"
                  label="Equipos Reparados"
                  sublabel="Procesados"
                  icon={<Activity className="h-5 w-5" />}
                />
                <StatBox
                  value="99.9%"
                  label="Uptime Garantizado"
                  sublabel="Disponibilidad"
                  icon={<Globe2 className="h-5 w-5" />}
                />
                <StatBox
                  value="256-bit"
                  label="Encriptación SSL"
                  sublabel="Seguridad"
                  icon={<ShieldCheck className="h-5 w-5" />}
                />
              </div>

              {/* FOOTER IZQUIERDO */}
              <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4">
                <span>© 2026 5G CELL. Todos los derechos reservados.</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Headphones className="h-3.5 w-3.5 text-cyan-400" /> Soporte Técnico
                </span>
              </div>
            </div>

            {/* =============================================================== */}
            {/* SECCIÓN DERECHA: FORMULARIO DE INGRESO Y REGISTRO (5 COLS)     */}
            {/* =============================================================== */}
            <div className="relative flex flex-col justify-between bg-slate-950/70 p-8 lg:col-span-5 sm:p-10 xl:p-12">
              
              {/* Header para Mobile (Visible solo en pantallas pequeñas) */}
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white">5G CELL</h1>
                    <p className="text-[9px] font-bold tracking-widest text-cyan-400">
                      COMUNICACIONES
                    </p>
                  </div>
                </div>
                <SystemStatusBadge />
              </div>

              <div className="my-auto w-full max-w-md mx-auto">
                
                {/* TITULO FORMULARIO */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 mb-3">
                    {isRegister ? <Layers className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
                    {isRegister ? "Nuevo Registro Taller" : "Acceso Seguro"}
                  </div>
                  <h2 className="text-3xl font-black text-white sm:text-4xl">
                    {isRegister ? "Crear cuenta" : "Bienvenido de nuevo"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {isRegister
                      ? "Registra tu taller para comenzar a administrar reparaciones."
                      : "Ingresa tus credenciales para acceder a la plataforma."}
                  </p>
                </div>

                {/* ALERTA DE MENSAJES DINÁMICOS */}
                {message && (
                  <div
                    className={`mb-6 rounded-2xl border p-4 text-sm font-semibold shadow-xl backdrop-blur-md flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                      messageType === "success"
                        ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 shadow-emerald-500/10"
                        : "border-red-500/50 bg-red-950/40 text-red-300 shadow-red-500/10"
                    }`}
                  >
                    {messageType === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400 animate-ping shrink-0" />
                    )}
                    <span>{message}</span>
                  </div>
                )}

                {/* FORMULARIO PRINCIPAL */}
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    if (isRegister) {
                      e.preventDefault();
                      handleRegister();
                    } else {
                      handleLogin(e);
                    }
                  }}
                >
                  {/* CAMPOS ADICIONALES PARA REGISTRO */}
                  {isRegister && (
                    <>
                      {/* Nombre del Taller */}
                      <div className="relative group">
                        <Building2
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none"
                        />
                        <input
                          className={inputClass}
                          placeholder="Nombre del taller"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>

                      {/* Nombre del Propietario */}
                      <div className="relative group">
                        <User
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none"
                        />
                        <input
                          className={inputClass}
                          placeholder="Nombre del propietario"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                        />
                      </div>

                      {/* Teléfono */}
                      <div className="relative group">
                        <Phone
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none"
                        />
                        <input
                          className={inputClass}
                          placeholder="Teléfono de contacto"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Correo Electrónico */}
                  <div className="relative group">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none"
                    />
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Contraseña */}
                  <div className="relative group">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClass}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Confirmar Contraseña (Solo Registro) */}
                  {isRegister && (
                    <div className="relative group">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none"
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={inputClass}
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}

                  {/* Recuperar Contraseña (Solo Login) */}
                  {!isRegister && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={resetLoading}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {resetLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                        {resetLoading ? "Enviando enlace..." : "¿Olvidaste tu contraseña?"}
                      </button>
                    </div>
                  )}

                  {/* BOTÓN PRINCIPAL ACCIÓN */}
                  <div className="relative group pt-2">
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 opacity-60 group-hover:opacity-100 blur transition duration-300 animate-pulse" />
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_auto] hover:bg-right py-4 font-bold text-sm text-white transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <span>{isRegister ? "Crear cuenta de taller" : "Ingresar al sistema"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* BOTÓN CONMUTADOR DE INICIO / REGISTRO */}
                <div className="mt-8 border-t border-white/10 pt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-all duration-300"
                  >
                    <span>
                      {isRegister
                        ? "¿Ya tienes una cuenta registrada? Inicia sesión"
                        : "¿Aún no tienes cuenta? Registrate"}
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-300">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                </div>

              </div>

              {/* FOOTER GARANTÍAS DERECHA */}
              <div className="mt-8 flex justify-center gap-6 border-t border-white/10 pt-6 text-[11px] font-medium text-slate-500">
                <div className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  <span>Seguro SSL</span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                  <Zap size={14} className="text-cyan-400" />
                  <span>Acceso Rápido</span>
                </div>
                <div className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                  <CheckCircle2 size={14} className="text-cyan-400" />
                  <span>Soporte 24/7</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}