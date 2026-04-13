import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function Home() {
  const { user, logout } = useAuth();

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
      <main className="max-w-2xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-4">Bienvenido</h2>
        <p className="text-white/80 text-lg mb-6">
          Has iniciado sesión correctamente. Esta aplicación está en construcción.
        </p>
        <Link
          to="/permisos"
          className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          Ir a Permisos de usuarios
        </Link>
      </main>
    </div>
  );
}
