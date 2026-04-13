import { useState } from "react";
import { Link } from "react-router-dom";
import RegisterModal from "../components/RegisterModal";

export default function Landing() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registeredHint, setRegisteredHint] = useState(false);

  const handleRegistered = () => {
    setRegisteredHint(true);
    window.setTimeout(() => setRegisteredHint(false), 6000);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Under Construction</h1>
      <p className="text-white/70 mb-6 text-center max-w-md">
        Inicia sesión con tu usuario o crea una cuenta nueva
      </p>
      {registeredHint && (
        <div className="mb-6 max-w-md w-full p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-100 text-sm text-center">
          Cuenta creada correctamente. Usa tu usuario y contraseña en &quot;Iniciar sesión&quot;.
        </div>
      )}
      <div className="flex flex-col items-center gap-4">
        <Link
          to="/guia-login"
          className="text-white/60 hover:text-white text-sm underline"
        >
          Ver guía: Cómo funciona el login
        </Link>
        <Link
          to="/guia-codigo-login"
          className="text-white/60 hover:text-white text-sm underline"
        >
          Ver explicación del código del login
        </Link>
        <Link
          to="/exposicion-spring-boot"
          className="text-white/60 hover:text-white text-sm underline"
        >
          Exposición: archivos y Spring Boot (API)
        </Link>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none justify-center">
          <Link
            to="/login"
            className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all text-center"
          >
            Iniciar sesión
          </Link>
          <button
            type="button"
            onClick={() => setRegisterOpen(true)}
            className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-center"
          >
            Crear cuenta
          </button>
        </div>
      </div>

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={handleRegistered}
      />
    </div>
  );
}
