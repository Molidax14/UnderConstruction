# Resumen de acciones realizadas (chat)

Documento que resume lo hecho en la conversación: base de datos MariaDB, procedimientos almacenados, API (ahora **Spring Boot**), frontend Permisos y despliegue en producción.

---

## 1. Base de datos `underconstruction`

- **Base:** `underconstruction` (utf8mb4 / utf8mb4_unicode_ci).
- **Usuario de aplicación:** `underconstruction`@`localhost` con privilegios sobre esa base.
- **Credenciales:** en `/home/ubuntu/underconstruction/.env` (`DB_*`). Archivo `.gitignore` actualizado para no versionar `.env`.

---

## 2. Tablas

| Tabla | Descripción breve |
|-------|-------------------|
| **usuarios** | `IdUsuarios` (AI PK), `Nombre`, `Usuario` (único), `Clave` (hash bcrypt). |
| **TipoPermiso** | `IdTipoPermiso` (AI PK), `NombrePermiso`, `DescripcionPermiso`. |
| **Permisos** | `IdPermisos` (AI PK), `IdUsuarios`, `IdTipoPermiso`, `Acceso` (TINYINT). FKs a `usuarios` y `TipoPermiso`, único `(IdUsuarios, IdTipoPermiso)`. |

- Datos iniciales: 5 usuarios (Excel), tipos de permiso (incl. `Modulo_Permisos`), filas en `Permisos` según lo indicado.

---

## 3. Contraseñas (bcrypt)

- **bcryptjs** como devDependency.
- Script **`bun run hash-password -- <contraseña>`** → genera hash para `INSERT` en `usuarios.Clave`.
- Documentación en `context/mariadb-underconstruction.md`.

---

## 4. Procedimientos almacenados

| Nombre | Rol |
|--------|-----|
| **ConsultarUsuarios** | Devuelve `IdUsuarios`, `Nombre` (sustituye al antiguo `ConsultaUsuarios`). |
| **ConsultaPermisosXUsuarios** | Parámetro `IdUsuarios`; devuelve `IdPermisos`, `Nombre Permiso`, `Descripcion`, `Acceso` (join con `TipoPermiso`). |
| **ActualizarAcceso** | Parámetros `IdPermisos`, `Acceso` (0/1); actualiza solo `Acceso` en `Permisos`. |

---

## 5. API y página Permisos (React)

- **Servidor:** `backend-spring/` (Spring Boot 3, MariaDB JDBC, **JWT** con Spring Security).
- **Puerto API por defecto:** `3099` (`API_PORT` / `server.port`; `SERVER_ADDRESS` default `127.0.0.1`).
- **Auth:** `POST /api/auth/login` (bcrypt contra `usuarios`); rutas de datos con `Authorization: Bearer <jwt>`.
- **Endpoints:** (mismos procedimientos almacenados)
  - `GET /api/usuarios` → `ConsultarUsuarios`
  - `GET /api/permisos?usuario=<IdUsuarios>` → `ConsultaPermisosXUsuarios`
  - `PATCH /api/permisos/<IdPermisos>` body `{ "acceso": 0 \| 1 }` → `ActualizarAcceso`
- **Frontend:** **`/permisos`** con `authFetch`; login en `/login` y registro público `POST /api/auth/register` (modal Crear cuenta).
- **Scripts:** `api` → `mvn spring-boot:run`; `dev:all` → API + Vite.
- **Proxy Vite:** `/api` → `http://localhost:3099`.
- **`.env`:** `DB_*` y **`JWT_SECRET`** (obligatorio en producción).
- Documentación: `context/api-permisos.md`, `context/backend-spring.md`.

---

## 6. Producción (puerto 5175)

- **`bun run build`** y copia de `dist/*` a **`/var/www/underconstruction`**.
- **Apache:** módulos `proxy` y `proxy_http`; en el VirtualHost del 5175:
  - `ProxyPass /api http://127.0.0.1:3099/api`
  - `ProxyPassReverse` equivalente.
- **No hace falta abrir el 3099 en AWS:** el tráfico entra por 5175 y Apache reenvía `/api` a Spring en localhost.
- **systemd:** **`underconstruction-api.service`** ejecuta el JAR `backend-spring/target/api-0.0.1-SNAPSHOT.jar` con `EnvironmentFile=.env`. Tras cambios Java: `mvn package` + `systemctl restart`.
- Contexto actualizado: `context/produccion-apache.md`.

---

## 7. Comandos útiles recordados en el chat

```bash
# Tablas
sudo mysql underconstruction -e "SHOW TABLES;"

# Permisos de un usuario
sudo mysql underconstruction -e "CALL ConsultaPermisosXUsuarios(1);"

# Desarrollo frontend + API
cd /home/ubuntu/underconstruction && bun run dev:all
```

---

## 8. Preguntas frecuentes (resumen de respuestas)

- **¿Cerrar Cursor cae la página?** Producción (5175): no. Desarrollo si `dev:all` corre solo en la terminal de Cursor: sí, al cerrar esa terminal.
- **¿Dónde corre la API?** En producción: proceso **Java** (systemd). En desarrollo: terminal con `mvn spring-boot:run` o `npm run api`.
- **¿Abrir 3099 en AWS?** No, si se usa el proxy de Apache en 5175.

---

## 9. Archivos de contexto relevantes

- `context/mariadb-underconstruction.md` — BD, tablas, procedimientos, bcrypt.
- `context/api-permisos.md` — API y página Permisos (dev).
- `context/backend-spring.md` — Backend Java, JWT, variables.
- `context/produccion-apache.md` — Apache, actualización estática, API systemd.
- `context/despliegue-y-arquitectura.md` — ya existía; stack y despliegue dev.

---

*Generado como resumen de la conversación; ajustar fechas o detalles de IP si cambian en tu entorno.*
