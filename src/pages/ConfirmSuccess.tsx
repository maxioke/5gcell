import { CheckCircle2, ArrowRight } from "lucide-react";

export default function ConfirmSuccess() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030712] flex items-center justify-center p-4 font-sans selection:bg-cyan-500 selection:text-white">
      {/* ------------------------------------------------------------------- */}
      {/* LUCES Y AMBIENTE DE FONDO                                           */}
      {/* ------------------------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/20 blur-[160px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-700/25 blur-[120px]" />

        {/* Patrón de Malla Cyber */}
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
      {/* TARJETA CENTRAL DE CONFIRMACIÓN ÉXITOSA                              */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-white/15 bg-slate-900/50 p-8 text-center backdrop-blur-3xl shadow-[0_35px_100px_rgba(0,0,0,0.8)] sm:p-10">
        
        {/* Borde Neón Glow Superior */}
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]" />

        {/* ICONO DE ÉXITO CIRCULAR */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 blur opacity-70 animate-pulse" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-cyan-400/40 bg-slate-950/90 text-cyan-400 shadow-2xl backdrop-blur-xl">
            <CheckCircle2 className="h-10 w-10 text-cyan-400" />
          </div>
        </div>

        {/* TITULAR Y MENSAJE */}
        <h1 className="text-3xl font-black text-white sm:text-4xl tracking-tight">
          ¡Confirmado con éxito!
        </h1>
        
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Tu correo electrónico ha sido verificado correctamente. Ya puedes acceder al sistema de <span className="font-bold text-cyan-400">5G CELL</span> para gestionar tu taller.
        </p>

        {/* BOTÓN PARA REGRESAR AL LOGIN */}
        <div className="mt-8">
          <a
            href="/"
            className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_auto] hover:bg-right py-4 font-bold text-sm text-white transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-[0.98] uppercase tracking-wider"
          >
            <span>Ir a Iniciar Sesión</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="mt-8 border-t border-white/10 pt-4 text-[11px] font-medium text-slate-500">
          © 2026 5G CELL. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}