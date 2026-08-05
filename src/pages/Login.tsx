import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  User,
  Building2,
  Sparkles,
  Loader2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { supabase } from "../lib/supabase";



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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      setMessageType("error");
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          business_name: businessName,
          owner_name: ownerName,
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
  const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300 shadow-inner hover:border-cyan-500/30 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:bg-slate-900";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050914] p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Luces de Fondo y Grid Cyberpunk */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-600/25 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-600/25 blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Card Principal Glassmorphism */}
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,.55)] z-10 lg:grid lg:grid-cols-2">

  <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-gradient-to-br from-cyan-700 via-slate-900 to-blue-950 p-10">

      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"></div>
    
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl"></div>
    
      <div className="relative z-10">
    
        <div className="flex items-center gap-3">
    
          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
    
            <Smartphone size={34} className="text-cyan-300"/>
    
          </div>
          
    
          <div>
    
            <h1 className="text-3xl font-black text-white">
    
              5G CELL
    
            </h1>
    
            <p className="text-cyan-300 tracking-[0.35em] text-xs">
    
              COMUNICACIONES
    
            </p>
    
          </div>
    
        </div>
    
        <h2 className="mt-16 text-5xl font-black leading-tight text-white">
    
          Gestiona tu
    
          <br />
    
          taller desde
    
          <br />
    
          cualquier lugar.
    
        </h2>
    
        <p className="mt-8 text-lg leading-8 text-slate-300">
    
          Clientes, órdenes, inventario, pagos,
    
          historial y reportes en una sola plataforma.
    
        </p>
    
      </div>
    
      <div className="relative z-10 grid grid-cols-2 gap-4">
    
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    
          <p className="text-3xl font-black text-cyan-300">
    
            +1500
    
          </p>
    
          <span className="text-slate-300 text-sm">
    
            Reparaciones
    
          </span>
    
        </div>
    
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    
          <p className="text-3xl font-black text-cyan-300">
    
            100%
    
          </p>
    
          <span className="text-slate-300 text-sm">
    
            En la nube
    
          </span>
    
        </div>
    
      </div>
    
    </div>
        
        {/* Borde Superior Neo-Glow */}
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="p-7 sm:p-9">
        {/* HEADER PREMIUM */}



  <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-[0_0_15px_#22c55e]"></div>

</div>

<h1 className="mt-7 text-4xl font-black tracking-[0.25em] bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">

    5G CELL

</h1>

<p className="mt-2 uppercase tracking-[0.55em] text-[10px] text-cyan-400 font-bold">

    COMUNICACIONES

</p>

<p className="mt-4 max-w-xs text-center text-sm leading-6 text-slate-400">

    Gestiona clientes, órdenes de servicio, inventario y reparaciones desde una sola plataforma.

</p>

<div className="mt-6 flex gap-2 flex-wrap justify-center">

    <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-2">

        <ShieldCheck size={14}/>
        Seguro

    </div>

    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-2">

        <Zap size={14}/>
        En la nube

    </div>

    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">

        <Sparkles size={14}/>
        Profesional

    </div>

</div>

</div>

        {/* Mensaje de Alerta */}
        {message && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3.5 text-sm font-medium shadow-xl backdrop-blur-md flex items-center gap-3 ${
              messageType === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Formulario */}
        <form
          className="space-y-5"
          onSubmit={(e) => {
            if (isRegister) {
              e.preventDefault();
              handleRegister();
            } else {
              handleLogin(e);
            }
          }}
        >
          {isRegister && (
            <>
              <div className="relative">
                <Building2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Nombre del taller"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Nombre del propietario"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>

              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none transition-all duration-300"
                  size={18}
                />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Teléfono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={18}
            />
            <input
  type="email"
  className={inputClass}
  placeholder="Correo electrónico"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
          </div>

          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/80 focus:bg-slate-950/80 focus:ring-4 focus:ring-cyan-500/20"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isRegister && (
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {!isRegister && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition font-medium hover:underline underline-offset-4 disabled:opacity-50 flex items-center gap-1.5"
              >
                {resetLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {resetLoading ? "Enviando..." : "¿Olvidaste tu contraseña?"}
              </button>
            </div>
          )}


<div className="relative pt-4">

<button
  type="submit"
  disabled={loading}
  className="group relative overflow-hidden w-full rounded-2xl py-4 font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_35px_rgba(34,211,238,.35)] disabled:opacity-60"
>

  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

  <span className="relative flex items-center justify-center gap-2">

    {loading ? (
      <>
        <Loader2 className="w-5 h-5 animate-spin" />
        Procesando...
      </>
    ) : (
      <>
        <Zap className="w-5 h-5" />
        {isRegister ? "Crear cuenta" : "Ingresar"}
      </>
    )}

  </span>

</button>

</div>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <button
type="button"
onClick={() => setIsRegister(!isRegister)}
className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-all duration-300"
>

<span>

{isRegister
? "Ya tengo una cuenta"
: "Crear una cuenta"}

</span>

<div className="h-5 w-5 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500 flex items-center justify-center transition">

➜

</div>

</button>
<div className="mt-8 flex justify-center gap-6 text-[11px] text-slate-500">

<div className="flex items-center gap-1">

<ShieldCheck size={13}/>

<span>Seguro</span>

</div>

<div className="flex items-center gap-1">

<Zap size={13}/>

<span>Rápido</span>

</div>

<div className="flex items-center gap-1">

<CheckCircle2 size={13}/>

<span>En la nube</span>

</div>

</div>
        </div>

      </div>
    
  );

}
