import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import LoginLayout from "../components/LoginLayout";
import RegisterModal from "../components/RegisterModal";

export default function LoginGeneric() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registeredHint, setRegisteredHint] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario,
          password,
          tipo: "generic",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Usuario o contraseña incorrectos");
        return;
      }
      if (data.ok && data.user && data.token) {
        login(data.user, data.token);
        navigate("/home");
      } else {
        setError("Respuesta inválida del servidor");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout brandText="Under Construction">
      <div className="bg-black border border-white/20 rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Iniciar sesión</h2>
        {registeredHint && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-100 text-sm rounded-lg">
            Cuenta creada. Ya puedes iniciar sesión.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="login-usuario" className="block text-sm font-medium text-white/90 mb-1">
              Usuario
            </label>
            <input
              id="login-usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/40"
              placeholder="Usuario"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-white/90 mb-1">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/40"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-60 transition-all"
          >
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
        <div className="mt-4 space-y-3">
          <p className="text-center text-white/60 text-sm">¿No tienes cuenta?</p>
          <button
            type="button"
            onClick={() => setRegisterOpen(true)}
            className="w-full py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
          >
            Crear cuenta nueva
          </button>
        </div>
        <p className="mt-2 text-center">
          <Link to="/" className="text-white/50 hover:text-white/80 text-sm">
            ← Volver al inicio
          </Link>
        </p>
      </div>

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => {
          setRegisteredHint(true);
          window.setTimeout(() => setRegisteredHint(false), 8000);
        }}
      />
    </LoginLayout>
  );
}
