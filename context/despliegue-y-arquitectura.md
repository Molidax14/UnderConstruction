# Contexto: Despliegue público y arquitectura

## 1. Arquitectura de la aplicación Under Construction

### 1.1 Stack tecnológico

| Capa        | Tecnología        | Uso                                   |
|-------------|-------------------|----------------------------------------|
| Frontend    | React 19          | UI, componentes, páginas               |
| Build       | Vite 7            | Dev server, bundling, HMR              |
| Estilos     | Tailwind CSS 4    | Diseño, layout, utilidades             |
| Rutas       | React Router 7    | Navegación, rutas protegidas           |
| Auth        | Context API + JWT | Login vía API Spring; token en sessionStorage |
| Runtime     | Bun / Node        | Ejecución de npm scripts               |

### 1.2 Estructura del proyecto

```
underconstruction/
├── context/                    # Documentación de contexto
│   └── despliegue-y-arquitectura.md
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── LoginLayout.jsx     # Layout split: texto izq, form der
│   │   └── ProtectedRoute.jsx  # Guard para rutas protegidas
│   ├── context/
│   │   └── AuthProvider.jsx    # Estado global de autenticación
│   ├── api/
│   │   └── authFetch.js        # Peticiones autenticadas (JWT)
│   ├── pages/
│   │   ├── Landing.jsx         # / - enlaces a logins
│   │   ├── LoginGeneric.jsx    # /login - login estándar
│   │   ├── RegisterModal.jsx   # Modal crear cuenta → POST /api/auth/register
│   │   └── Home.jsx            # /home - página protegida
│   ├── App.jsx                 # Rutas y providers
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

### 1.3 Diagrama de rutas

```
/ (Landing)
  └── Enlaces a /login y modal “Crear cuenta”

/login (LoginGeneric)
  └── POST /api/auth/login — usuarios en MariaDB; enlace a modal de registro

/home (Protected)
  └── Requiere autenticación
  └── AuthProvider + ProtectedRoute
```

### 1.4 Flujo de datos

```
Usuario → LoginGeneric o registro (RegisterModal)
  → POST /api/auth/login (Spring valida bcrypt en BD)
  → AuthProvider.login(user, token JWT)
  → sessionStorage (usuario + token) + estado React
  → navigate("/home")
  → ProtectedRoute verifica isAuthenticated
  → Home renderiza
```

---

## 2. Pasos para publicar y acceder desde un computador remoto

### 2.1 Papel de Vite

Vite es el servidor de desarrollo de la aplicación React.

- Sirve la app en modo desarrollo con hot-reload.
- Por defecto escucha en `localhost` (127.0.0.1), no accesible desde fuera.
- Para acceso remoto debe escuchar en todas las interfaces: `host: "0.0.0.0"`.
- Usa un puerto fijo (5175) para que las conexiones lleguen a la app.

**Configuración en `vite.config.js`:**

```js
server: {
  host: "0.0.0.0",  // Escuchar en todas las interfaces (incl. IP pública)
  port: 5175,
  strictPort: true,
}
```

Sin `host: "0.0.0.0"`, Vite solo atiende en localhost y no es accesible por IP pública.

---

### 2.2 AWS Security Group

Controla el tráfico entrante a la instancia EC2 desde internet.

**Pasos:**

1. EC2 → **Security Groups** → seleccionar el del servidor.
2. Pestaña **Inbound rules** → **Edit inbound rules**.
3. Añadir regla:
   - **Type:** Custom TCP
   - **Port range:** 5175
   - **Source:** 0.0.0.0/0 (o restringir por IP)
4. Guardar.

Sin esta regla, el tráfico a 5175 se bloquea en AWS antes de llegar al servidor.

---

### 2.3 UFW (firewall del servidor)

UFW es el firewall en el servidor Linux. Puede bloquear puertos aunque el Security Group los permita.

**Problema habitual:** Security Group abierto, pero UFW bloquea el puerto.

**Solución:**

```bash
sudo ufw allow 5175/tcp
sudo ufw status   # Comprobar que 5175 aparece
```

---

### 2.4 Secuencia completa

| Paso | Acción |
|------|--------|
| 1 | Configurar Vite con `host: "0.0.0.0"` y `port: 5175` |
| 2 | Abrir puerto 5175 en AWS Security Group (Inbound) |
| 3 | Abrir puerto 5175 en UFW: `sudo ufw allow 5175/tcp` |
| 4 | Arrancar la app: `bun run dev` o `npm run dev` |

---

### 2.5 Capas de seguridad (flujo de conexión)

```
Internet (navegador remoto)
    ↓
[AWS Security Group]  ← Primer filtro
    ↓
[UFW en el servidor]  ← Segundo filtro
    ↓
[Vite en 0.0.0.0:5175]  ← Servidor de la aplicación
```

---

## 3. Inconvenientes encontrados (lecciones)

| Problema | Causa | Solución |
|----------|-------|----------|
| IP 172.31.x.x no accesible desde fuera | IP privada de VPC AWS | Usar IP pública (ej. 34.224.67.191) |
| Security Group abierto pero no funciona | UFW bloqueaba el puerto | `sudo ufw allow 5175/tcp` |
| Solo funciona en localhost | `host` por defecto en Vite | `host: "0.0.0.0"` en vite.config.js |
| Localtunnel poco fiable | Servicio externo inestable | Preferir acceso directo por IP + puerto abierto |

---

## 4. URLs de acceso

- **Local:** http://localhost:5175/
- **Red / pública (ejemplo):** http://34.224.67.191:5175/
- **Puerto:** 5175 (distinto a 5173 del Devocional para evitar conflictos)
