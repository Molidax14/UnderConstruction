# Guía: ¿Cómo funciona el login?

**Presentación para estudiantes universitarios**  
Aplicación Under Construction

---

## 1. ¿Qué es un login?

Un **login** (inicio de sesión) es el proceso por el cual un usuario se identifica ante una aplicación escribiendo sus credenciales: **usuario** y **contraseña**.

```
Usuario escribe → Usuario + Contraseña → Sistema valida → ✅ Acceso permitido
                                                   → ❌ "Credenciales incorrectas"
```

---

## 2. Partes de nuestra aplicación

Nuestra app tiene **varias piezas** que trabajan juntas:

| Pieza | Archivo / servicio | Función |
|-------|-------------------|---------|
| **Formulario** | `LoginGeneric.jsx` | Captura usuario y contraseña |
| **Alta de cuenta** | `RegisterModal.jsx` | Modal: `POST /api/auth/register` |
| **Validación** | API **Spring Boot** (`POST /api/auth/login`) | Comprueba credenciales contra MariaDB (bcrypt) y devuelve un **JWT** |
| **Estado global** | `AuthProvider.jsx` | Guarda usuario y token en memoria y `sessionStorage` |

---

## 3. El formulario (capturar datos)

El usuario escribe en dos campos: **Usuario** y **Contraseña**. React guarda lo que escribe en variables llamadas **estado**.

```jsx
const [usuario, setUsuario] = useState("");
const [password, setPassword] = useState("");

<input
  value={usuario}
  onChange={(e) => setUsuario(e.target.value)}
  placeholder="Usuario"
/>
```

---

## 4. Enviar el formulario (handleSubmit)

Al pulsar "Iniciar sesión" se hace una petición **asíncrona** al backend. Si la respuesta es correcta, se guardan el usuario y el **token JWT**.

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password, tipo: "generic" }),
  });
  const data = await res.json();
  if (!res.ok) {
    setError(data.error || "Usuario o contraseña incorrectos");
    return;
  }
  if (data.ok && data.user && data.token) {
    login(data.user, data.token);
    navigate("/home");
  }
};
```

**Flujo:** el servidor compara la contraseña con el hash **bcrypt** en la tabla `usuarios` y responde con un token firmado (JWT).

---

## 5. Base de datos y seguridad (resumen)

- Los usuarios viven en MariaDB (`usuarios.Usuario`, `usuarios.Clave`).
- La contraseña **nunca** se guarda en texto plano; se usa **bcrypt**.
- El **JWT** identifica sesiones en peticiones posteriores (por ejemplo la página **Permisos**), enviado en la cabecera `Authorization: Bearer …`.

---

## 6. Guardar el usuario logueado (AuthProvider)

Tras un login correcto se guardan **usuario** (JSON) y **token** por separado en `sessionStorage`.

- `login(userData, token)` — persiste ambos.
- `logout()` — borra ambos.
- `isAuthenticated` — verdadero solo si hay usuario **y** token.

---

## 7. Proteger rutas (ProtectedRoute)

La ruta `/home` solo debe verse si el usuario está logueado. `ProtectedRoute` comprueba `isAuthenticated`; si es falso, redirige a `/login`.

---

## 8. Diagrama del flujo completo

```
Usuario → Formulario → POST /api/auth/login → Spring Boot + MariaDB (bcrypt)
                    → respuesta { user, token } → AuthProvider.login(user, token)
                    → navigate("/home")
         ❌ error → mensaje en pantalla
```

---

## 9. Credenciales

Las cuentas válidas son las filas de la tabla **`usuarios`** en MariaDB (no hay usuarios fijos en el código del frontend). Para crear o cambiar contraseñas se usa hash bcrypt (por ejemplo el script `hash-password` del proyecto).

---

## 10. Resumen

1. El formulario captura **usuario** y **contraseña** con `useState`.
2. Al enviar, se llama a la **API** que valida contra la base de datos.
3. Si es correcto, `AuthProvider.login(user, token)` guarda datos y JWT en `sessionStorage`.
4. `ProtectedRoute` solo deja ver `/home` si `isAuthenticated` es `true`.
5. Las peticiones a `/api/usuarios` y `/api/permisos` llevan el JWT en la cabecera `Authorization`.
