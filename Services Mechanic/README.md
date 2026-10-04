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
- CRUD de Clientes.
- CRUD de Empleados.
- CRUD de Vehículos.
- Relación entre Clientes y Vehículos.
- Validaciones mediante JavaScript.
- Diseño responsive para diferentes tamaños de pantalla.

El proyecto corresponde a un prototipo frontend, por lo que la información se administra temporalmente mediante estructuras de datos en JavaScript y no utiliza todavía una base de datos o backend.

## Módulos desarrollados

### Clientes

Permite registrar, consultar, actualizar y eliminar clientes.

Incluye validaciones para:

- Cédula numérica y única.
- Longitud máxima de cédula.
- Nombres y apellidos.
- Teléfono de 10 dígitos.
- Dirección.
- Generación automática de identificadores de cuatro dígitos.

También se controla que un cliente con vehículos asociados no pueda eliminarse directamente.

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
- Google Fonts - Manrope
- Git
- GitHub

## Estructura del proyecto


Services Mechanic/
├── css/
│   └── styles.css
├── img/
├── js/
│   └── script.js
├── index.html
└── README.md