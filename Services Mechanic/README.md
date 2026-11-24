# Services Mechanic

## Descripción del caso de estudio

Services Mechanic es una propuesta de sistema web orientada a apoyar la gestión administrativa de talleres mecánicos.

El sistema busca organizar información relacionada con clientes, vehículos, empleados, repuestos, servicios realizados, horas trabajadas y facturación.

Durante la Unidad 1 se desarrolló la Landing Page promocional del sistema utilizando HTML5 semántico, CSS3 y JavaScript.

En la Unidad 2 el proyecto fue ampliado mediante la adaptación de la interfaz a una plantilla web y la construcción de un aplicativo frontend que permite gestionar diferentes módulos del sistema.

Actualmente el proyecto incluye:

- Landing Page institucional.
- Pantalla de inicio de sesión.
- Panel principal del aplicativo.
- Gestión de Clientes integrada con Panther y MySQL/MariaDB.
- CRUD de Empleados.
- CRUD de Vehículos.
- CRUD de Repuestos integrado con Panther y MySQL/MariaDB.
- Relación entre Clientes y Vehículos.
- Validaciones en JavaScript y en el backend para los módulos integrados.
- Diseño responsive para diferentes tamaños de pantalla.

El inicio de sesión y los módulos Clientes y Repuestos utilizan el backend REST
de Panther y la base de datos `services_mechanic`. Empleados y Vehículos todavía
administran sus datos en memoria mediante JavaScript y no tienen persistencia.

## Módulos desarrollados

### Clientes

Permite registrar, consultar y actualizar clientes mediante Panther.

Incluye validaciones para:

- Cédula numérica y única.
- Longitud máxima de cédula.
- Nombres y apellidos.
- Teléfono de 10 dígitos.
- Dirección.
- Generación automática de identificadores de cuatro dígitos.

La eliminación permanece bloqueada hasta que el esquema permita comprobar las
relaciones con vehículos, servicios y facturas.

### Repuestos

Permite registrar, consultar y actualizar repuestos mediante Panther. Incluye
búsqueda por referencia, descripción o marca y validaciones de referencia única,
longitudes y precio.

La eliminación permanece bloqueada hasta que el módulo Servicios defina una
relación verificable con los repuestos.

### Empleados

Permite registrar, consultar, actualizar y eliminar empleados del taller.

El módulo administra información como:

- Identificador.
- Cédula.
- Nombres.
- Apellidos.
- Teléfono.
- Cargo.
- Estado de disponibilidad.

### Vehículos

Permite registrar, consultar, actualizar y eliminar vehículos asociados a clientes existentes.

La información gestionada incluye:

- Identificador.
- Placa.
- Marca.
- Línea.
- Modelo.
- Color.
- Propietario.
- Fecha y hora de ingreso.

Cada vehículo queda relacionado con un cliente registrado previamente.

## Acceso al sistema

El proyecto incorpora una pantalla de inicio de sesión que permite ingresar al aplicativo desde la Landing Page.

Desde el aplicativo también se dispone de una opción para cerrar sesión y regresar nuevamente al Landing Page.

## Identidad visual

La interfaz utiliza una paleta inspirada en el sector automotriz, combinando tonos oscuros con amarillo como color de énfasis.

### Colores principales

- Fondo oscuro: `#111315`
- Gris grafito: `#1B1E20`
- Amarillo: `#F5C518`
- Blanco: `#FFFFFF`
- Gris claro: `#F7F7F5`
- Texto oscuro: `#202124`

La tipografía principal utilizada es Manrope.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- PHP y Panther REST
- MySQL/MariaDB
- Google Fonts - Manrope
- Git
- GitHub

## Configuracion de la conexion de Panther

El backend conserva las constantes que utiliza `panther/rest/cxn/Connection.php`,
pero sus valores pueden configurarse mediante variables de entorno:

| Variable | Valor local de respaldo | Descripcion |
| --- | --- | --- |
| `PANTHER_DB_HOST` | `127.0.0.1` | Host de MySQL |
| `PANTHER_DB_PORT` | `3307` | Puerto de MySQL |
| `PANTHER_DB_NAME` | `panther` | Nombre de la base de datos |
| `PANTHER_DB_USER` | `root` | Usuario de MySQL |
| `PANTHER_DB_PASSWORD` | vacio | Contrasena de MySQL |

Con la configuracion actual de XAMPP no es necesario definir variables: los
valores de respaldo reproducen la conexion local existente. Si la instalacion
local usa otros valores, se deben crear las variables de entorno en Windows y
reiniciar Apache desde el panel de XAMPP para que el proceso las reciba. Para
una ejecucion temporal desde PowerShell se pueden definir en la sesion actual:

```powershell
$env:PANTHER_DB_HOST = '127.0.0.1'
$env:PANTHER_DB_PORT = '3307'
$env:PANTHER_DB_NAME = 'panther'
$env:PANTHER_DB_USER = 'root'
$env:PANTHER_DB_PASSWORD = ''
```

En un servidor futuro se deben definir las cinco variables en la configuracion
del servicio que ejecute PHP o Apache, preferiblemente mediante el gestor de
secretos del proveedor. La contrasena de produccion no debe escribirse en este
repositorio, en el `README.md` ni en un archivo `.env` versionado. Despues de
cambiar variables, se debe reiniciar el proceso del servidor web o PHP-FPM.

La documentación de los recursos REST se encuentra en
[`panther/rest/docs/clients-api.md`](panther/rest/docs/clients-api.md) y
[`panther/rest/docs/repuestos-api.md`](panther/rest/docs/repuestos-api.md).
La instalacion unificada de la base y la creacion local de un administrador se
documentan en [`panther/sql/README.md`](panther/sql/README.md).

## Estructura del proyecto


Services Mechanic/
├── css/
│   └── styles.css
├── img/
├── js/
│   ├── script.js
│   ├── clientes.js
│   └── repuestos.js
├── panther/
│   ├── rest/
│   └── sql/
├── index.html
└── README.md
