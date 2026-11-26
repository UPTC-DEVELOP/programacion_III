# Kevin — entrega de referencia

Paquete de entrega del developer **Kevin** (persons / vehiculos / empleados).

## Backend canónico

El código vive en el backend compartido del equipo:

`Panther/backend_panther/panther/rest/`

| Entrega Kevin | Ubicación actual |
|---|---|
| `Persons.php` | `…/ctrl/business/Persons.php` |
| `Person.php` | `…/model/business/Person.php` |
| `Vehiculos.php` | `…/ctrl/business/Vehiculos.php` |
| `Vehiculo.php` | `…/model/business/Vehiculo.php` |
| `Empleados.php` | `…/ctrl/business/Empleados.php` |
| `Empleado.php` | `…/model/business/Empleado.php` |
| `BusinessQuery.php` | `…/querys/business/BusinessQuery.php` |
| Script SQL | `Panther/database/panther.sql` |

## Endpoints REST

Con Authorization (keyAPI del login):

- `GET|POST|PUT|DELETE …/rest/persons`
- `GET|POST|PUT|DELETE …/rest/vehiculos`
- `GET|POST|PUT|DELETE …/rest/empleados`

## Front

Los CRUD de `Proyecto_Unidad/pages/{clientes,vehiculos,empleados}.html` consumen estos recursos vía `PantherApi`.
