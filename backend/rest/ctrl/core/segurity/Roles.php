<?php
declare(strict_types=1);

namespace panther\ctrl\core\segurity;

use panther\ctrl\core\commun\Request;
use panther\querys\core\RoleQueries;
use PDO;
use PDOStatement;
/**
 * <b>Descripción:</b> Clase que <br/>
 * Gestiona las operaciones CRUD relacionadas con los roles del sistema Panther.
 * Extiende la clase abstracta Request, proporcionando la lógica de negocio
 * para la inserción y actualización de registros en la tabla "j4rol".
 *
 * <b>Caso de Uso:</b> PANTHER - Seguridad <br/>
 * <b>Versión:</b> Actualización Panther 2025 - Compatible con PHP 8.4 <br/>
 *
 * Esta clase define las consultas SQL asociadas a los roles del sistema,
 * especifica cómo asignar parámetros a las sentencias preparadas y garantiza
 * la integridad de los datos mediante PDO y consultas seguras.
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 */

class Roles extends Request
{
    /**
     * ------------------------------------------------------------
     * CONSTANTES DE LA CLASE
     * ------------------------------------------------------------
     * NAME_TABLE: define el nombre de la tabla de roles dentro de la base de datos.
     */
    private const NAME_TABLE = 'j4rol';

    // COLUMNAS: Define las columnas para mostrar en las operaciones CRUD.
    private const COLUMNAS = 'id, name, description';

    /**
     * ------------------------------------------------------------
     * CONSTRUCTOR
     * ------------------------------------------------------------
     * Inicializa la configuración necesaria para las operaciones CRUD
     * de la entidad "Users".
     *
     * Este constructor se ejecuta automáticamente al crear una instancia
     * de la clase y se encarga de:
     * - Definir el nombre de la tabla asociada al modelo.
     * - Asignar las sentencias SQL para las operaciones de inserción (INSERT)
     *   y actualización (UPDATE).
     *
     * Reemplaza el uso del antiguo método init(), centralizando la
     * configuración en la instancia del objeto.
     *
     * @return void
     */
    public function __construct()
    {
    $this->nameTable   = self::NAME_TABLE;
    $this->queryInsert = RoleQueries::INSERT;
    $this->queryUpdate = RoleQueries::UPDATE;
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: insertParameter
     * ------------------------------------------------------------
     * Asigna los parámetros necesarios a la sentencia SQL preparada
     * para insertar un nuevo rol en la base de datos.
     *
     * Se espera que el objeto recibido contenga los atributos:
     * - name: nombre del rol.
     * - description: descripción del rol o sus permisos asociados.
     *
     * @param object        $object     Objeto con los datos a insertar.
     * @param PDOStatement  $statement  Sentencia preparada para ejecución.
     * @return void
     */
    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindParam(1, $object->name, PDO::PARAM_STR);
        $statement->bindParam(2, $object->description, PDO::PARAM_STR);
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: updateParameter
     * ------------------------------------------------------------
     * Asigna los parámetros necesarios a la sentencia SQL preparada
     * para actualizar un rol existente en la base de datos.
     *
     * Se espera que el objeto contenga los campos:
     * - name: nuevo nombre del rol.
     * - description: nueva descripción o permisos.
     *
     * @param object        $object     Objeto con los datos actualizados.
     * @param PDOStatement  $statement  Sentencia SQL preparada.
     * @param int           $id         Identificador del registro a actualizar.
     * @return void
     */
    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindParam(1, $object->name, PDO::PARAM_STR);
        $statement->bindParam(2, $object->description, PDO::PARAM_STR);
        $statement->bindParam(3, $id, PDO::PARAM_INT);
    }
}

