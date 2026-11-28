<?php
declare(strict_types=1);

namespace panther\ctrl\core\segurity;

use panther\ctrl\core\commun\Request;
use panther\querys\core\UserQueries;
use panther\ctrl\core\segurity\UserAction;
use PDO;
use PDOStatement;
/**
 * <b>Descripción:</b> Clase que <br/>
 * Gestiona las operaciones CRUD para los usuarios del sistema Panther.
 * Extiende la clase abstracta Request, implementando la lógica específica
 * para la inserción y actualización de usuarios en la base de datos.
 *
 * <b>Caso de Uso:</b> PANTHER - Seguridad <br/>
 * <b>Versión:</b> Actualización Panther 2025 - Compatible con PHP 8.4 <br/>
 *
 * Esta clase define los parámetros de conexión y las consultas SQL
 * utilizadas para manejar los usuarios, encriptar sus contraseñas y
 * generar tokens únicos (keyAPI) para autenticación segura.
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 */

class Users extends Request
{
    /**
     * ------------------------------------------------------------
     * CONSTANTES DE LA CLASE
     * ------------------------------------------------------------
     * NAME_TABLE: nombre de la tabla que contiene los datos de usuarios.
     */
    private const NAME_TABLE = 'j4user';

    // Columnas específicas para la clase Users para las consultas SELECT
    protected const COLUMNAS = "id, user, roles";

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
    $this->queryInsert = UserQueries::INSERT;
    $this->queryUpdate = UserQueries::UPDATE;
}

    /**
     * ------------------------------------------------------------
     * MÉTODO: insertParameter
     * ------------------------------------------------------------
     * Asigna los parámetros necesarios a la sentencia SQL preparada
     * para insertar un nuevo usuario en la base de datos.
     * 
     * Antes de la inserción:
     * - Encripta la contraseña en texto plano usando BCRYPT.
     * - Genera un token aleatorio (keyAPI) para identificar la sesión.
     *
     * @param object        $object     Objeto con los datos del usuario.
     * @param PDOStatement  $statement  Sentencia preparada para ejecución.
     * @return void
     */
    public function insertParameter(object $object, PDOStatement $statement): void
    {
        // Encripta la contraseña y genera una clave de sesión
        $encryptedPassword = UserAction::encryptPassword($object->password);
        $keyApi = UserAction::getKeyAPI();

        // Asigna los valores a la sentencia preparada
        $statement->bindParam(1, $object->user, PDO::PARAM_STR);
        $statement->bindParam(2, $encryptedPassword, PDO::PARAM_STR);
        $statement->bindParam(3, $keyApi, PDO::PARAM_STR);
        $statement->bindParam(4, $object->roles, PDO::PARAM_STR);
    }

    /**
     * ------------------------------------------------------------
     * MÉTODO: updateParameter
     * ------------------------------------------------------------
     * Asigna los parámetros necesarios a la sentencia SQL preparada
     * para actualizar los datos de un usuario existente.
     *
     * Antes de la actualización:
     * - Vuelve a encriptar la contraseña si ha sido modificada.
     * - Genera una nueva clave keyAPI (por seguridad en cada actualización).
     *
     * @param object        $object     Objeto con los datos actualizados.
     * @param PDOStatement  $statement  Sentencia SQL preparada.
     * @param int           $id         Identificador del registro a actualizar.
     * @return void
     */
    public function updateParameter(object $object, PDOStatement $statement, int|string $id): void
    {
        // Encripta la contraseña y genera una nueva clave API
        $encryptedPassword = UserAction::encryptPassword($object->password);
        $keyApi = UserAction::getKeyAPI();

        // Asigna los valores a la sentencia preparada
        $statement->bindParam(1, $encryptedPassword, PDO::PARAM_STR);
        $statement->bindParam(2, $keyApi, PDO::PARAM_STR);
        $statement->bindParam(3, $object->roles, PDO::PARAM_STR);
        $statement->bindParam(4, $id, PDO::PARAM_INT);
    }
}
