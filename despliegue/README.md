# Publicar TallerPro en InfinityFree

El frontend y el backend Panther se publican **en el mismo dominio**:

```
htdocs/                  <- frontend (index.html, crud_*, Login, api, ...)
htdocs/panther/rest/     <- backend Panther (PHP)
```

`api/panther.js` detecta solo dónde está: en local usa `http://localhost/panther/rest`
y en el hosting usa `https://<tu-dominio>/panther/rest`.

> InfinityFree tiene un filtro anti-bots que bloquea peticiones a la API desde **otros**
> dominios o desde programas como Postman. Por eso todo va en el mismo dominio y las
> pruebas en producción se hacen desde el navegador (usando la página).

## 1. Crear la cuenta y el sitio
1. Regístrate en https://www.infinityfree.com y crea una cuenta de hosting
   (elige un subdominio gratis, por ejemplo `tallerpro.infinityfreeapp.com`).
2. Espera a que el dominio quede activo (puede tardar unos minutos).

## 2. Crear la base de datos
1. En el panel (*Control Panel*) entra a **MySQL Databases** y crea una base, por ejemplo `panther`.
   Quedará con un nombre como `if0_12345678_panther`.
2. Anota los datos que muestra el panel: **MySQL Host Name**, **DB Name**, **User Name** y la
   **contraseña** (está en *Account Details* → *MySQL Password*).
3. Abre **phpMyAdmin** desde el panel, selecciona la base e importa
   `panther-master/database/panther.sql`.

## 3. Configurar la conexión
1. Copia `panther-master/backend_panther/panther/rest/cxn/LoginMysql.prod.example.php`
   como `LoginMysql.prod.php` en la misma carpeta.
2. Llena los cuatro datos del paso 2.  
   Este archivo está en `.gitignore`: **no se sube al repositorio**.

## 4. Armar y subir los archivos
1. Desde la carpeta del proyecto ejecuta:
   ```
   powershell -ExecutionPolicy Bypass -File despliegue\preparar_despliegue.ps1
   ```
   Se crea `dist\htdocs` con el frontend y el backend juntos.
2. Sube **el contenido** de `dist\htdocs` a la carpeta `htdocs` del hosting, con el
   *File Manager* del panel o por FTP (FileZilla, con los datos de *FTP Details*).
   Asegúrate de que se suba `panther/rest/.htaccess` (algunos clientes ocultan los archivos que empiezan con punto).

## 5. Verificar
1. Abre `https://<tu-dominio>/panther/rest/clientes`: debe responder un JSON con
   `"code": 400` y *"Se requiere Token"*. Eso confirma que PHP, el `.htaccess` y Panther funcionan.
2. Abre `https://<tu-dominio>/` y entra a Clientes, Empleados y Administradores.
   Inicia sesión con **admin / 12345** y prueba crear, editar y eliminar.

## Problemas comunes
| Síntoma | Causa probable |
|---|---|
| `500` o JSON con *SQLSTATE[HY000] [2002]* | Datos incorrectos en `LoginMysql.prod.php` |
| `404` de Apache en `/panther/rest/clientes` | No se subió `.htaccess` o quedó en otra carpeta |
| *Se requiere Token* después de iniciar sesión | El hosting no pasó la cabecera; ya hay respaldo en `.htaccess` y `UserAction.php`, revisa que se subió la versión nueva |
| La tabla no carga y en la consola aparece CORS | El frontend no está en el mismo dominio que el backend |
| Cambios que no se ven | Caché del navegador: recarga con Ctrl+F5 |
