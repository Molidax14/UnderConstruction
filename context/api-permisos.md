# API y página Permisos

## Desarrollo

La página **Permisos** (`/permisos`) consume una API REST (Spring Boot) que llama a los procedimientos almacenados de MariaDB.

### Ejecutar frontend + API

```bash
cd /home/ubuntu/underconstruction
bun run dev:all
```

O en dos terminales:

- `bun run api` (Spring Boot, puerto **3099**)
- `bun run dev` (puerto **5176**; el 5175 lo usa Apache en este servidor)

Vite hace proxy de `/api` a `http://localhost:3099`. En el navegador: `http://localhost:5176` (o la IP pública con `:5176` si abres el puerto en firewall/SG).

**Login:** credenciales reales de la tabla `usuarios` (campo `Usuario`, contraseña hasheada con bcrypt en `Clave`). Tras el login, el navegador guarda un **JWT** y las peticiones a permisos/usuarios lo envían en `Authorization: Bearer …`.

### Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Body JSON `usuario`, `password`, `tipo` (p. ej. `generic`). Respuesta: `token`, `user`. |
| POST | `/api/auth/register` | No | Alta en `usuarios`: `nombre`, `usuario`, `password` (bcrypt). 409 si el usuario ya existe. |
| GET | `/api/usuarios` | JWT | Lista usuarios (`ConsultarUsuarios`) |
| GET | `/api/permisos?usuario=1` | JWT | **Todos** los `TipoPermiso` con LEFT JOIN a `Permisos` (sin fila → `Acceso` 0, `IdPermisos` null) |
| PATCH | `/api/permisos/celda` | JWT | Body `{ "idUsuarios", "idTipoPermiso", "acceso": 0\|1 }` — crea fila en `Permisos` al activar (1) o actualiza; si apagas (0) y no había fila, no inserta |
| PATCH | `/api/permisos/:idPermisos` | JWT | (Legacy) Actualiza solo `Acceso` vía `ActualizarAcceso` |
| GET | `/api/health` | No | Comprobación rápida |

### Página Permisos

- **Ruta:** `/permisos` (protegida, requiere login)
- **Select Usuarios:** lista nombres de `usuarios` (ConsultarUsuarios)
- **Tabla:** Nombre Permiso, Descripción, Acceso (toggle)
- **Toggle:** al cambiar llama ActualizarAcceso con IdPermisos y 0/1

### Producción

1. Compilar y ejecutar Spring Boot como servicio systemd en el puerto 3099 (JAR en `backend-spring/target/`).
2. Apache hace proxy de `/api` al backend (véase `underconstruction-apache.conf`).

Variables `.env`: `DB_*`, `JWT_SECRET`, opcional `API_PORT`. Detalle: `backend-spring/README.md` y `context/backend-spring.md`.
