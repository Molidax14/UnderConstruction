/**
 * Layout compartido para login: izquierda = texto de marca, derecha = formulario.
 * Diseño basado en LoginModal del Devocional (fondo oscuro, inputs estilo Devocional).
 */
export default function LoginLayout({ brandText, children }) {
  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Izquierda: texto de marca */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-md">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            {brandText}
          </h1>
          <p className="mt-4 text-white/70 text-lg">
            Ingresa tus credenciales para continuar
          </p>
        </div>
      </div>

      {/* Derecha: formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
