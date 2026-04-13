# Continuidad del proyecto Under Construction

Documento maestro para retomar el trabajo: enlaza el resto de contexto, rutas en servidor y procedimientos sin duplicar secretos.

**Fecha de referencia del resumen de chat:** 20/03/2026.

---

## 1. Mapa de documentación

| Documento | Contenido |
|-----------|-------------|
| [produccion-apache.md](./produccion-apache.md) | Build, Apache, puerto 5175, proxy `/api`, systemd, actualización en producción |
| [despliegue-y-arquitectura.md](./despliegue-y-arquitectura.md) | Stack (React 19, Vite 7, Tailwind 4, Router 7), estructura `src/`, flujo auth, despliegue **dev** (Vite `0.0.0.0:5175`), AWS SG + UFW |
| [resumen-chat-acciones.md](./resumen-chat-acciones.md) | BD MariaDB, tablas, procedimientos almacenados, API Spring Boot, página Permisos, producción, comandos útiles, FAQ |
| [mariadb-underconstruction.md](./mariadb-underconstruction.md) | Detalle BD, bcrypt, script `hash-password` |
| [api-permisos.md](./api-permisos.md) | API y página Permisos (desarrollo) |
| [backend-spring.md](./backend-spring.md) | Backend Java, JWT, variables de entorno |

---

## 2. Arquitectura en una frase

**Frontend estático** servido por **Apache** en el puerto **5175** (`/var/www/underconstruction`); **Spring Boot** en **127.0.0.1:3099**; Apache hace **proxy** de `/api` al backend. **MariaDB** en localhost para usuarios y permisos.

---

## 3. Acceso a base de datos y secretos (sin valores)

Los valores reales viven solo en:

`/home/ubuntu/underconstruction/.env`

**Variables esperadas (no commitear el archivo):**

| Variable | Uso |
|----------|-----|
| `DB_HOST` | Host MariaDB (típicamente `localhost`) |
| `DB_PORT` | Puerto (típicamente `3306`) |
| `DB_NAME` | Nombre de la base (`underconstruction`) |
| `DB_USER` | Usuario de aplicación con privilegios sobre esa base |
| `DB_PASSWORD` | Contraseña del usuario de aplicación |
| `JWT_SECRET` | Firma de tokens JWT (obligatorio coherente entre entornos en producción) |

El backend en producción carga el mismo `.env` vía **`EnvironmentFile`** en el servicio systemd `underconstruction-api` (ver `produccion-apache.md` y `resumen-chat-acciones.md`).

**Usuario de aplicación en MariaDB:** `underconstruction`@`localhost` sobre la base `underconstruction` (utf8mb4).

---

## 4. URLs y puertos (revisar IP si la instancia cambia)

| Entorno | URL / puerto |
|---------|----------------|
| App producción local | `http://localhost:5175/` |
| App producción pública | `http://<IP_PUBLICA_EC2>:5175/` (ejemplo histórico en docs: `34.224.67.191`) |
| API (solo interno con Apache) | `http://127.0.0.1:3099` — **no** hace falta abrir 3099 en AWS si el tráfico entra por 5175 |

**Desarrollo:** Vite en **5175** con `host: "0.0.0.0"`; proxy `/api` → `localhost:3099`. Abrir **5175** en Security Group y UFW si se accede remotamente en modo dev.

---

## 5. Actualización futura en producción (checklist)

1. **Frontend:** `cd /home/ubuntu/underconstruction && bun run build` → `sudo cp -r dist/* /var/www/underconstruction/` → `sudo chown -R www-data:www-data /var/www/underconstruction/`. No suele hacer falta reiniciar Apache.
2. **Backend:** `cd backend-spring && mvn -q package -DskipTests` → desplegar JAR según `underconstruction-api.service` → `sudo systemctl restart underconstruction-api`.
3. **BD / `.env`:** si cambian credenciales o `JWT_SECRET`, actualizar `.env` y reiniciar la API; invalidar sesiones si cambia el secreto JWT.

---

## 6. Servicios y rutas en el servidor

| Qué | Dónde |
|-----|--------|
| Sitio Apache | `/var/www/underconstruction/` |
| VirtualHost | `/etc/apache2/sites-available/underconstruction.conf` |
| Puerto Apache (Listen) | `5175` en `/etc/apache2/ports.conf` |
| API systemd | `sudo systemctl status underconstruction-api` |
| Código fuente | `/home/ubuntu/underconstruction/` |

---

## 7. API (recordatorio rápido)

- **Auth:** `POST /api/auth/login`; registro: `POST /api/auth/register`.
- **Datos (JWT):** `GET /api/usuarios`, `GET /api/permisos?usuario=<IdUsuarios>`, `PATCH /api/permisos/<IdPermisos>` con `{ "acceso": 0 \| 1 }`.
- **Procedimientos:** `ConsultarUsuarios`, `ConsultaPermisosXUsuarios`, `ActualizarAcceso`.

---

## 8. Comandos útiles

```bash
# Desarrollo: frontend + API
cd /home/ubuntu/underconstruction && bun run dev:all

# Inspección rápida BD
sudo mysql underconstruction -e "SHOW TABLES;"
sudo mysql underconstruction -e "CALL ConsultaPermisosXUsuarios(1);"

# Hash de contraseña para inserts
bun run hash-password -- '<contraseña>'
```

---

*Este archivo no sustituye los demás: sirve como índice y guión de continuidad. Si rotas credenciales, hazlo solo en `.env` y en MariaDB, nunca en documentación versionada.*
