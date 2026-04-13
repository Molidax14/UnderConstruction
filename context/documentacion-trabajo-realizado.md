# Documentación del trabajo realizado — Under Construction

Documento maestro que consolida el estado del proyecto y enlaza el resto de notas de contexto. **Última actualización de contenido:** abril 2026 (síntesis de `resumen-chat-acciones.md`, despliegue, producción Apache).

---

## 1. Objetivo del proyecto

Aplicación web **Under Construction**: frontend React (Vite, Tailwind), autenticación con JWT, gestión de **permisos por usuario** frente a una base **MariaDB**, API en **Spring Boot**, y despliegue accesible en red (desarrollo con Vite; producción con Apache en el puerto **5175**).

---

## 2. Base de datos y acceso

| Elemento | Detalle |
|----------|---------|
| Motor | MariaDB |
| Base | `underconstruction` (utf8mb4 / utf8mb4_unicode_ci) |
| Usuario de aplicación | `underconstruction`@`localhost`, privilegios sobre esa base |
| Credenciales | Definidas en `/home/ubuntu/underconstruction/.env` — variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. **No versionar** `.env` (debe estar en `.gitignore`). |
| Secreto JWT | Variable `JWT_SECRET` en el mismo `.env` — obligatoria en producción para la API. |

**Nota de seguridad:** no copiar valores reales de `.env` en documentación ni en chats públicos. Si alguna vez se filtraron, conviene rotar contraseña de BD y regenerar `JWT_SECRET`.

Documentación detallada de esquema, bcrypt y scripts: `context/mariadb-underconstruction.md`.

---

## 3. Modelo de datos (resumen)

- **usuarios:** identificador, nombre, usuario único, clave con hash **bcrypt**.
- **TipoPermiso:** catálogo de tipos de permiso.
- **Permisos:** relación usuario–tipo con campo **Acceso** (0/1), restricciones de unicidad y FKs.

Datos iniciales cargados según especificación (usuarios desde Excel, tipos y filas de permisos). Generación de hashes: `bun run hash-password -- <contraseña>` (ver `mariadb-underconstruction.md`).

---

## 4. Procedimientos almacenados

| Procedimiento | Uso |
|---------------|-----|
| `ConsultarUsuarios` | Listado de usuarios para la UI de permisos. |
| `ConsultaPermisosXUsuarios` | Permisos de un usuario por `IdUsuarios`. |
| `ActualizarAcceso` | Actualizar solo el flag de acceso de una fila de `Permisos`. |

---

## 5. API (Spring Boot) y frontend

- **Backend:** `backend-spring/` — Spring Boot 3, JDBC MariaDB, Spring Security + **JWT**.
- **Puerto API:** `3099` (configurable con `API_PORT` / `server.port`; escucha típica `127.0.0.1`).
- **Auth:** `POST /api/auth/login`; rutas de datos con `Authorization: Bearer <jwt>`.
- **Endpoints principales:** `GET /api/usuarios`, `GET /api/permisos?usuario=…`, `PATCH /api/permisos/<id>`; registro público `POST /api/auth/register` (modal “Crear cuenta”).
- **Frontend:** rutas como `/login`, `/home`, **`/permisos`**; `authFetch` para peticiones autenticadas; proxy Vite en desarrollo: `/api` → `http://localhost:3099`.

Referencias: `context/api-permisos.md`, `context/backend-spring.md`.

---

## 6. Arquitectura inicial y acceso en desarrollo

- Stack: React 19, Vite 7, Tailwind 4, React Router 7, Context + JWT en `sessionStorage`.
- Para acceso remoto en **dev:** Vite con `host: "0.0.0.0"` y puerto **5175**; abrir **5175** en Security Group de AWS y en **UFW** (`ufw allow 5175/tcp`).
- Lecciones (IP privada vs pública, UFW vs SG, etc.): `context/despliegue-y-arquitectura.md`.

---

## 7. Producción (Apache + estáticos + API)

Resumen ejecutable:

1. **Frontend:** `bun run build` → copiar `dist/*` a `/var/www/underconstruction/` con propietario `www-data`.
2. **Apache:** VirtualHost en puerto **5175**, `FallbackResource` para SPA; **no** hace falta reiniciar Apache solo por cambiar estáticos.
3. **Proxy:** `/api` → `http://127.0.0.1:3099/api` — el puerto **3099** no debe exponerse en AWS si todo pasa por **5175**.
4. **API:** servicio systemd `underconstruction-api` (JAR Spring), suele cargar variables desde `.env` vía `EnvironmentFile`.

Procedimiento completo y URLs: `context/produccion-apache.md`.

---

## 8. Comandos útiles

```bash
# Desarrollo: frontend + API
cd /home/ubuntu/underconstruction && bun run dev:all

# Inspección rápida de BD
sudo mysql underconstruction -e "SHOW TABLES;"
sudo mysql underconstruction -e "CALL ConsultaPermisosXUsuarios(1);"

# Tras cambios en backend (producción)
cd /home/ubuntu/underconstruction/backend-spring && mvn -q package -DskipTests
sudo systemctl restart underconstruction-api
```

---

## 9. Índice de archivos de contexto

| Archivo | Contenido |
|---------|-----------|
| `context/resumen-chat-acciones.md` | Resumen de acciones del chat (20/03/2026 y evolución). |
| `context/despliegue-y-arquitectura.md` | Stack, rutas, flujo auth, publicación dev (Vite, AWS, UFW). |
| `context/produccion-apache.md` | Build, Apache, UFW/SG, systemd, actualización futura en prod. |
| `context/mariadb-underconstruction.md` | BD, tablas, SPs, bcrypt. |
| `context/api-permisos.md` | API y página Permisos en desarrollo. |
| `context/backend-spring.md` | Backend Java, JWT, variables. |
| **Este archivo** | Síntesis del trabajo hecho y mapa de documentación. |

---

*Para actualizar este documento cuando cambie la infraestructura (IP, puertos, rutas de JAR), edita las secciones afectadas y mantén `produccion-apache.md` como fuente de verdad operativa.*
