<?php
declare(strict_types=1);

namespace panther\ctrl\business;

use panther\ctrl\core\commun\Request;
use panther\querys\business\PruebaQueries;
use PDO;
use PDOStatement;
/**
 * <b>Descripción:</b> Clase que <br/>
 * Gestiona las operaciones CRUD de la entidad "Products" en la base de datos.
 * Implementa los métodos definidos en la clase abstracta Request,
 * especificando las consultas y parámetros propios de la tabla "products".
 *
 * <b>Caso de Uso:</b> PANTHER - Business <br/>
 * <b>Versión:</b> Actualización Panther 2025 - Compatible con PHP 8.4 <br/>
 *
 * Esta clase representa la capa de negocio para el manejo de productos,
 * permitiendo crear, actualizar y recuperar información mediante
 * peticiones REST seguras.
 *
  * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 */



class Prueba extends Request
{
    /**
     * ------------------------------------------------------------
     * CONSTANTES DE LA CLASE
     * ------------------------------------------------------------
     * NAME_TABLE: Define el nombre de la tabla asociada al modelo.
     */
    private const NAME_TABLE = 'datosprueba';
    // COLUMNAS: Define las columnas para mostrar en las operaciones CRUD.
    private const COLUMNAS = 'id, nombre, correo, telefono, edad';

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
        $this->queryInsert = PruebaQueries::INSERT;
        $this->queryUpdate = PruebaQueries::UPDATE;
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: insertParameter
     * ------------------------------------------------------------
     * Asigna los valores de un objeto "Person" a los parámetros
     * de la sentencia preparada para ejecutar la inserción en la BD.
     *
     * @param object $object     Objeto con los datos a insertar.
     * @param PDOStatement $statement Sentencia SQL preparada.
     * @return void
     */
    public function insertParameter(object $object, PDOStatement $statement): void
    {
        $statement->bindParam(1, $object->nombre, PDO::PARAM_STR);
        $statement->bindParam(2, $object->correo, PDO::PARAM_STR);
        $statement->bindParam(3, $object->telefono, PDO::PARAM_STR);
        $statement->bindParam(4, $object->edad, PDO::PARAM_STR);
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: updateParameter
     * ------------------------------------------------------------
     * Asigna los valores de un objeto "Person" a los parámetros
     * de la sentencia preparada para ejecutar una actualización en la BD.
     *
     * @param object $object     Objeto con los datos a actualizar.
     * @param PDOStatement $statement Sentencia SQL preparada.
     * @param int $id            Identificador del registro a actualizar.
     * @return void
     */
    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        $statement->bindParam(1, $object->nombre, PDO::PARAM_STR);
        $statement->bindParam(2, $object->correo, PDO::PARAM_STR);
        $statement->bindParam(3, $object->telefono, PDO::PARAM_STR);
        $statement->bindParam(4, $object->edad, PDO::PARAM_STR);
        $statement->bindParam(5, $id, PDO::PARAM_INT);
    }
}
