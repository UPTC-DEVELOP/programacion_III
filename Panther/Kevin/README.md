# Kevin — entrega de referencia

Paquete de entrega del developer **Kevin** (persons / vehiculos / empleados).

## Backend canónico

El código **ya está integrado** en el backend compartido:

`Proyecto_Unidad/panther/`

| Entrega Kevin | Ubicación en Proyecto_Unidad |
|---|---|
| `Persons.php` | `panther/rest/ctrl/business/Persons.php` |
| `Person.php` | `panther/rest/model/business/Person.php` |
| `Vehiculos.php` | `panther/rest/ctrl/business/Vehiculos.php` |
| `Vehiculo.php` | `panther/rest/model/business/Vehiculo.php` |
| `Empleados.php` | `panther/rest/ctrl/business/Empleados.php` |
| `Empleado.php` | `panther/rest/model/business/Empleado.php` |
| `BusinessQuery.php` | `panther/rest/querys/business/BusinessQuery.php` |
| `ResourcesURL.php` | `panther/rest/util/ResourcesURL.php` (`persons`, `vehiculos`, `empleados`) |
| Script SQL | `panther/database/panther.sql` (script único de la BD) |

## Endpoints REST

Con Authorization (keyAPI del login):

- `GET|POST|PUT|DELETE …/rest/persons`
- `GET|POST|PUT|DELETE …/rest/vehiculos`
- `GET|POST|PUT|DELETE …/rest/empleados`

## Front

Los CRUD de `Proyecto_Unidad/pages/{clientes,vehiculos,empleados}.html` consumen estos recursos vía `PantherApi`.

**No editar este folder como backend vivo**; es solo referencia histórica del paquete de Kevin.
