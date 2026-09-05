# Services Mechanic

## Descripción del caso de estudio

Services Mechanic es un sistema orientado a apoyar la gestión de talleres mecánicos.

El sistema permite organizar información relacionada con clientes, vehículos, empleados, repuestos, servicios realizados, horas trabajadas y facturación.

En esta primera fase se desarrolla la estructura semántica del sitio web utilizando HTML5, principios básicos de accesibilidad web y validaciones nativas de formularios.

## Roles del equipo

### Frontend Architect

Responsable del diseño modular de la estructura HTML, la organización de las secciones semánticas y el cumplimiento del flujo del documento.

Integrante: [Liceth Torres]

### Accessibility Lead (a11y)

Responsable de revisar la estructura semántica, el uso de atributos ARIA, la accesibilidad de los elementos y la propuesta conceptual de contraste visual.

Integrante: [Sebastian Herrera]

### Quality Assurance (QA) & Forms Engineer

Responsable de la parametrización del formulario, las validaciones nativas, los atributos data-* y la validación final del código mediante el W3C Validator.

Integrante: [Santiago Aguilar]

## Propuesta conceptual de colores y contraste

Para futuras fases de diseño visual se propone una paleta relacionada con el sector automotriz.

Colores principales:

- Fondo oscuro: #111315
- Gris grafito: #1B1E20
- Amarillo: #F5C518
- Blanco: #FFFFFF
- Gris claro: #F7F7F5
- Texto oscuro: #202124

La combinación de colores deberá respetar los criterios de accesibilidad definidos por WCAG nivel AA:

- Contraste mínimo de 4.5:1 para texto normal.
- Contraste mínimo de 3:1 para texto grande.

## Estructura del proyecto

Services Mechanic/
├── css/
├── img/
├── js/
├── index.html
└── README.md