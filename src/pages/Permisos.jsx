import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../api/authFetch";

const API = "/api";

function accesoActivo(val) {
  const n = Number(val);
  return n === 1;
}

async function fetchUsuarios() {
  const res = await authFetch(`${API}/usuarios`);
  if (!res.ok) throw new Error("Error al cargar usuarios");
  return res.json();
}

async function fetchPermisos(idUsuarios) {
  const res = await authFetch(`${API}/permisos?usuario=${idUsuarios}`);
  if (!res.ok) throw new Error("Error al cargar permisos");
  return res.json();
}

async function actualizarCelda(idUsuarios, idTipoPermiso, acceso) {
  const res = await authFetch(`${API}/permisos/celda`, {
    method: "PATCH",
    body: JSON.stringify({ idUsuarios, idTipoPermiso, acceso }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Error al actualizar permiso");
  }
  return res.json();
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? "bg-emerald-500" : "bg-white/20"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full
          bg-white shadow ring-0 transition duration-200
          ${checked ? "translate-x-5" : "translate-x-1"}
        `}
      />
    </button>
  );
}

export default function Permisos() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingTipo, setUpdatingTipo] = useState(null);

  useEffect(() => {
    fetchUsuarios()
      .then(setUsuarios)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUsuario) {
      setPermisos([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchPermisos(selectedUsuario)
      .then(setPermisos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedUsuario]);

  const handleToggle = async (row) => {
    const idTipo = Number(row.IdTipoPermiso);
    const idUser = Number(selectedUsuario);
    const nuevoAcceso = accesoActivo(row.Acceso) ? 0 : 1;
    setUpdatingTipo(idTipo);
    try {
      const data = await actualizarCelda(idUser, idTipo, nuevoAcceso);
      setPermisos((prev) =>
        prev.map((p) =>
          Number(p.IdTipoPermiso) === idTipo
            ? {
                ...p,
                IdPermisos: data.idPermisos != null ? data.idPermisos : p.IdPermisos,
                Acceso: data.acceso,
              }
            : p
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingTipo(null);
    }
  };

  const getNombrePermiso = (row) =>
    row["Nombre Permiso"] ?? row.NombrePermiso ?? "";

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/20 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Under Construction</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/70 text-sm">
            {user?.usuario} ({user?.tipo})
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <div className="flex gap-4 mb-2">
          <button
            onClick={() => navigate("/home")}
            className="text-white/70 hover:text-white text-sm"
          >
            ← Volver al inicio
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-2">Permisos de usuarios</h2>
        <p className="text-white/60 text-sm mb-6 max-w-2xl">
          Se listan <strong>todos</strong> los tipos de permiso. Cada interruptor está apagado hasta que
          lo actives: así decides qué puede hacer cada usuario.
        </p>

        <div className="mb-6">
          <label
            htmlFor="usuarios-select"
            className="block text-sm font-medium text-white/80 mb-2"
          >
            Usuarios
          </label>
          <select
            id="usuarios-select"
            value={selectedUsuario}
            onChange={(e) => setSelectedUsuario(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
          >
            <option value="">Seleccione un usuario</option>
            {usuarios.map((u) => (
              <option key={u.IdUsuarios} value={u.IdUsuarios}>
                {u.Nombre}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {loading && selectedUsuario ? (
          <p className="text-white/60">Cargando permisos…</p>
        ) : permisos.length === 0 && selectedUsuario ? (
          <p className="text-white/60">
            No hay tipos de permiso definidos en la base de datos (tabla TipoPermiso).
          </p>
        ) : selectedUsuario ? (
          <div className="overflow-x-auto rounded-lg border border-white/20">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/10">
                  <th className="px-4 py-3 font-semibold">Nombre permiso</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold text-center w-28">
                    Permitir
                  </th>
                </tr>
              </thead>
              <tbody>
                {permisos.map((row) => {
                  const idTipo = Number(row.IdTipoPermiso);
                  return (
                    <tr
                      key={idTipo}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="px-4 py-3">{getNombrePermiso(row)}</td>
                      <td className="px-4 py-3 text-white/80">
                        {row.Descripcion ?? ""}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle
                          checked={accesoActivo(row.Acceso)}
                          onChange={() => handleToggle(row)}
                          disabled={updatingTipo === idTipo}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>
    </div>
  );
}
