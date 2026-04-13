# Under Construction

Aplicación React con dos pantallas de login (genérico y ACM); la autenticación es contra la API **Spring Boot** (tabla `usuarios` en MariaDB, JWT).

## Inicio rápido

Solo frontend (sin permisos ni login real contra BD):

```bash
bun install
bun run dev
```

Frontend + API (Spring + Vite): `bun run dev:all`.

La app de desarrollo usa el puerto **5176** (véase `vite.config.js`).

## Acceso desde otro computador / internet

**Opción 1 – Red local:** Si estás en la misma red, usa la IP del servidor:
```
http://<IP-DEL-SERVIDOR>:5174
```

**Opción 2 – Tunnel público (localtunnel):** Para acceder desde cualquier sitio:
```bash
# Terminal 1: servidor
npm run dev

# Terminal 2: tunnel público
npm run tunnel
```
Te dará una URL tipo `https://algo-random.loca.lt` para acceder desde internet.

## Rutas

- `/` - Landing con enlaces a ambos logins
- `/login` - Login genérico
- `/home` - Página protegida tras autenticación

## Credenciales

Usuarios definidos en MariaDB (`usuarios.Usuario` / `usuarios.Clave` con bcrypt). La API corre en el puerto **3099**; Vite hace proxy de `/api`.

## Estructura

```
underconstruction/
├── backend-spring/          # API Spring Boot (puerto 3099)
├── src/
│   ├── api/
│   │   └── authFetch.js     # fetch con JWT
│   ├── auth/
│   │   └── storageKeys.js
│   ├── components/
│   │   ├── LoginLayout.jsx
│   │   ├── RegisterModal.jsx # Alta de cuenta (POST /api/auth/register)
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthProvider.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── LoginGeneric.jsx
│   │   └── Home.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```
