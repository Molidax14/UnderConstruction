import { useState } from "react";

export default function RegisterModal({ open, onClose, onRegistered }) {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setNombre("");
    setUsuario("");
    setPassword("");
    setConfirm("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, usuario, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo crear la cuenta");
        return;
      }
      reset();
      onRegistered?.();
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-black border border-white/20 rounded-2xl shadow-xl p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4 mb-4">
          <h2 id="register-title" className="text-xl font-bold">
            Crear cuenta
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/60 hover:text-white text-2xl leading-none px-1"
            aria-label="Cerrar ventana"
          >
            ×
          </button>
        </div>
        <p className="text-white/60 text-sm mb-4">
          Los datos se guardan en la base de datos. Podrás iniciar sesión con el usuario y la contraseña
          que elijas.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="reg-nombre" className="block text-sm font-medium text-white/90 mb-1">
              Nombre completo
            </label>
            <input
              id="reg-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/40"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="reg-usuario" className="block text-sm font-medium text-white/90 mb-1">
              Usuario
            </label>
            <input
              id="reg-usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoComplete="username"
              minLength={2}
              maxLength={64}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/40"
              placeholder="usuario_elegido"
            />
            <p className="text-white/40 text-xs mt-1">Letras, números, punto, guion o guion bajo</p>
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-white/90 mb-1">
              Contraseña
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/40"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-white/90 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="reg-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:border-white/40"
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-60 transition-all"
            >
              {loading ? "Creando…" : "Registrarme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
