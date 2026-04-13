# Producción de Under Construction con Apache

## Resumen

La aplicación Under Construction se puso en producción servida por **Apache** (el mismo servidor web que usa Moodle en este entorno). La app es independiente de Cursor/terminal y persiste tras reinicios del sistema.

---

## Lo que se realizó para ponerla en producción

### 1. Build de producción

```bash
cd /home/ubuntu/underconstruction
bun run build
```

Genera la carpeta `dist/` con archivos estáticos optimizados (HTML, CSS, JS).

### 2. Copia de archivos a Apache

```bash
sudo mkdir -p /var/www/underconstruction
sudo cp -r dist/* /var/www/underconstruction/
sudo chown -R www-data:www-data /var/www/underconstruction
```

- **DocumentRoot:** `/var/www/underconstruction`
- **Propietario:** `www-data` (usuario de Apache)

### 3. Configuración de Apache

- **Puerto:** 5175 (añadido `Listen 5175` en `/etc/apache2/ports.conf`)
- **VirtualHost:** `/etc/apache2/sites-available/underconstruction.conf`
- **FallbackResource** para rutas de React Router (SPA): las rutas como `/login`, `/home` devuelven `index.html`
- Sitio habilitado: `a2ensite underconstruction`

### 4. UFW

El puerto 5175 debe estar permitido (ya configurado):

```bash
sudo ufw allow 5175/tcp
```

### 5. AWS Security Group

En EC2 → Security Groups → Inbound rules: permitir Custom TCP en puerto 5175, Source 0.0.0.0/0.

---

## URLs de acceso

| Tipo    | URL                         |
|---------|-----------------------------|
| Local   | http://localhost:5175/      |
| Pública | http://34.224.67.191:5175/  |

---

## API backend (Spring Boot)

La página de Permisos y el login consumen la API. El JAR de Spring Boot corre como servicio systemd en el puerto **3099**:

```bash
sudo systemctl status underconstruction-api
sudo systemctl restart underconstruction-api  # tras desplegar nuevo JAR
```

Antes de reiniciar, recompilar: `cd backend-spring && mvn -q package -DskipTests`. Copiar o referenciar el JAR según `underconstruction-api.service`.

Apache hace proxy de `/api` a `http://127.0.0.1:3099`. **No hay que abrir el puerto 3099 en AWS**: todo el tráfico entra por 5175 y Apache reenvía internamente.

## Cómo actualizar la app en el futuro

Cuando hagas cambios en el código:

```bash
cd /home/ubuntu/underconstruction
bun run build
sudo cp -r dist/* /var/www/underconstruction/
sudo chown -R www-data:www-data /var/www/underconstruction
```

**No es necesario reiniciar Apache** para actualizar los archivos estáticos. Si cambias el backend Java, genera el JAR y reinicia la API: `sudo systemctl restart underconstruction-api`.

---

## Archivos de referencia

- Configuración Apache: `/etc/apache2/sites-available/underconstruction.conf`
- Contenido servido: `/var/www/underconstruction/`
- Código fuente: `/home/ubuntu/underconstruction/`
- Contexto de despliegue: `context/despliegue-y-arquitectura.md`
