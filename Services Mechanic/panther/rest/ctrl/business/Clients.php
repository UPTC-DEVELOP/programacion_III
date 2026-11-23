<?php

/**
 * Gestiona el recurso REST clients con validaciones propias del negocio.
 *
 * Sobrescribe las operaciones genericas de Request para impedir que una
 * eliminacion sin identificador pueda afectar todos los registros.
 */
class Clients extends Request
{
    const NAME_TABLE = 'clientes';

    public function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_CLIENT;
        parent::$queryUpdate = UPDATE_CLIENT;
    }

    /**
     * Lista clientes o busca por cedula, nombres y apellidos mediante ?q=.
     */
    public function get($request)
    {
        UserAction::authenticator();
        $this->assertNoPathSegments($request);

        $criterion = isset($_GET['q']) ? $_GET['q'] : '';

        if (! is_string($criterion)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El criterio de busqueda debe ser texto.');
        }

        $criterion = $this->trimUnicode($criterion);

        if (mb_strlen($criterion, 'UTF-8') > 40) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El criterio de busqueda permite maximo 40 caracteres.');
        }

        try {
            $pdo = Connection::getInstance()->getConnection();

            if ($criterion === '') {
                $statement = $pdo->prepare(SELECT_CLIENTS);
            } else {
                $statement = $pdo->prepare(SEARCH_CLIENTS);
                $statement->bindValue(1, $criterion, PDO::PARAM_STR);
                $statement->bindValue(2, $criterion, PDO::PARAM_STR);
                $statement->bindValue(3, $criterion, PDO::PARAM_STR);
            }

            $statement->execute();
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
            $clients = array();

            foreach ($rows as $row) {
                $clients[] = Client::fromRow($row);
            }

            if (count($clients) === 0) {
                $message = $criterion === ''
                    ? 'No hay clientes registrados.'
                    : 'No se encontraron clientes para el criterio indicado.';
            } else {
                $message = 'Consulta de clientes realizada exitosamente.';
            }

            return new ContentBody(OK, ST200, array(
                'message' => $message,
                'clientes' => $clients
            ));
        } catch (PDOException $exception) {
            $this->throwDatabaseException($exception, 'No fue posible consultar los clientes.');
        }
    }

    /**
     * Registra un cliente y devuelve su identificador publico de cuatro digitos.
     */
    public function post($request)
    {
        UserAction::authenticator();
        $this->assertNoPathSegments($request);

        $payload = $this->decodePayload();

        if (property_exists($payload, 'idCliente')) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'idCliente es generado automaticamente y no debe enviarse.');
        }

        $client = $this->validateClient($payload);
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            if ($this->cedulaExists($pdo, $client->cedula)) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'Ya existe un cliente con la cedula indicada.');
            }

            $statement = $pdo->prepare(INSERT_CLIENT);
            $this->insertParameter($client, $statement);
            $statement->execute();

            $id = (int) $pdo->lastInsertId();

            if ($id < 1 || $id > 9999) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'No hay identificadores de cliente disponibles entre 0001 y 9999.');
            }

            $pdo->commit();

            return new ContentBody(CREATE, ST201, array(
                'message' => 'Cliente registrado exitosamente.',
                'idCliente' => $this->publicIdentifier($id)
            ));
        } catch (ExcepcionAPI $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $exception;
        } catch (PDOException $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            $this->throwDatabaseException($exception, 'No fue posible registrar el cliente.');
        }
    }

    /**
     * Actualiza todos los datos editables del cliente seleccionado.
     */
    public function put($request)
    {
        UserAction::authenticator();
        $id = $this->identifierFromRequest($request);
        $publicId = $this->publicIdentifier($id);
        $payload = $this->decodePayload();

        if (property_exists($payload, 'idCliente') && $payload->idCliente !== $publicId) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El identificador del cliente no puede modificarse.');
        }

        $client = $this->validateClient($payload);
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            if (! $this->clientExists($pdo, $id)) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, 'El cliente indicado no existe.');
            }

            if ($this->cedulaExists($pdo, $client->cedula, $id)) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'La cedula pertenece a otro cliente.');
            }

            $statement = $pdo->prepare(UPDATE_CLIENT);
            $this->updateParameter($client, $statement, $id);
            $statement->execute();
            $pdo->commit();

            return new ContentBody(OK, ST200, array(
                'message' => 'Cliente actualizado exitosamente.',
                'idCliente' => $publicId
            ));
        } catch (ExcepcionAPI $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $exception;
        } catch (PDOException $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            $this->throwDatabaseException($exception, 'No fue posible actualizar el cliente.');
        }
    }

    /**
     * Valida la solicitud de eliminacion, pero no elimina mientras no existan
     * las tablas que permiten comprobar autos, servicios y facturas asociados.
     */
    public function delete($request)
    {
        UserAction::authenticator();
        $id = $this->identifierFromRequest($request);
        $payload = $this->decodePayload();

        if (! property_exists($payload, 'confirmacion') || $payload->confirmacion !== true) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'La eliminacion requiere confirmacion explicita con el valor true.');
        }

        try {
            $pdo = Connection::getInstance()->getConnection();

            if (! $this->clientExists($pdo, $id)) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, 'El cliente indicado no existe.');
            }
        } catch (PDOException $exception) {
            $this->throwDatabaseException($exception, 'No fue posible verificar el cliente.');
        }

        throw new ExcepcionAPI(
            CONFLICT,
            ST409,
            'Eliminacion deshabilitada: falta integrar la comprobacion de autos, servicios y facturas asociados.'
        );
    }

    /**
     * Enlaza los campos para mantener el contrato abstracto de Request.
     */
    public function insertParameter($object, $statement)
    {
        $statement->bindValue(1, $object->cedula, PDO::PARAM_STR);
        $statement->bindValue(2, $object->nombres, PDO::PARAM_STR);
        $statement->bindValue(3, $object->apellidos, PDO::PARAM_STR);
        $statement->bindValue(4, $object->telefono, PDO::PARAM_STR);
        $statement->bindValue(5, $object->direccion, PDO::PARAM_STR);
    }

    /**
     * Enlaza los campos actualizables y conserva el identificador.
     */
    public function updateParameter($object, $statement, $id)
    {
        $statement->bindValue(1, $object->cedula, PDO::PARAM_STR);
        $statement->bindValue(2, $object->nombres, PDO::PARAM_STR);
        $statement->bindValue(3, $object->apellidos, PDO::PARAM_STR);
        $statement->bindValue(4, $object->telefono, PDO::PARAM_STR);
        $statement->bindValue(5, $object->direccion, PDO::PARAM_STR);
        $statement->bindValue(6, $id, PDO::PARAM_INT);
    }

    private function decodePayload()
    {
        $payload = JSONUtil::decodeJSON();

        if (! is_object($payload)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere un cuerpo JSON valido.');
        }

        return $payload;
    }

    private function validateClient($payload)
    {
        $fields = array('cedula', 'nombres', 'apellidos', 'telefono', 'direccion');
        $values = array();

        foreach ($fields as $field) {
            if (! property_exists($payload, $field) || ! is_string($payload->$field)) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' es obligatorio y debe enviarse como texto.');
            }

            $values[$field] = $this->trimUnicode($payload->$field);

            if ($values[$field] === '') {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' no puede estar vacio ni contener solo espacios.');
            }
        }

        if (! preg_match('/^[0-9]{1,10}$/D', $values['cedula'])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'cedula debe contener entre 1 y 10 digitos.');
        }

        $this->validateName('nombres', $values['nombres']);
        $this->validateName('apellidos', $values['apellidos']);

        if (! preg_match('/^[0-9]{10}$/D', $values['telefono'])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'telefono debe contener exactamente 10 digitos.');
        }

        if (mb_strlen($values['direccion'], 'UTF-8') > 80) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'direccion permite maximo 80 caracteres.');
        }

        if (preg_match('/[\x00-\x1F\x7F]/u', $values['direccion'])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'direccion contiene caracteres de control no permitidos.');
        }

        return new Client(
            null,
            $values['cedula'],
            $values['nombres'],
            $values['apellidos'],
            $values['telefono'],
            $values['direccion']
        );
    }

    private function validateName($field, $value)
    {
        if (mb_strlen($value, 'UTF-8') > 40) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' permite maximo 40 caracteres.');
        }

        if (! preg_match('/^(?=.*\p{L})[\p{L} \'\x{2019}-]+\z/u', $value)) {
            throw new ExcepcionAPI(
                BAD_REQUEST,
                ST400,
                $field . ' solo permite letras, espacios, tildes, ene, guiones y apostrofos.'
            );
        }
    }

    private function trimUnicode($value)
    {
        return preg_replace('/^\s+|\s+$/u', '', $value);
    }

    private function assertNoPathSegments($request)
    {
        foreach ($request as $segment) {
            if ($segment !== '') {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, 'La URL contiene segmentos no permitidos para esta operacion.');
            }
        }
    }

    private function identifierFromRequest($request)
    {
        $segments = array();

        foreach ($request as $segment) {
            if ($segment !== '') {
                $segments[] = $segment;
            }
        }

        if (count($segments) !== 1 || ! preg_match('/^(?!0000)[0-9]{4}$/D', $segments[0])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere un idCliente valido de cuatro digitos en la URL.');
        }

        return (int) $segments[0];
    }

    private function publicIdentifier($id)
    {
        return str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function clientExists($pdo, $id)
    {
        $statement = $pdo->prepare(SELECT_CLIENT_BY_ID);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();

        return $statement->fetch(PDO::FETCH_ASSOC) !== false;
    }

    private function cedulaExists($pdo, $cedula, $excludedId = null)
    {
        if ($excludedId === null) {
            $statement = $pdo->prepare(COUNT_CLIENT_BY_CEDULA);
            $statement->bindValue(1, $cedula, PDO::PARAM_STR);
        } else {
            $statement = $pdo->prepare(COUNT_OTHER_CLIENT_BY_CEDULA);
            $statement->bindValue(1, $cedula, PDO::PARAM_STR);
            $statement->bindValue(2, $excludedId, PDO::PARAM_INT);
        }

        $statement->execute();

        return (int) $statement->fetchColumn() > 0;
    }

    private function throwDatabaseException($exception, $message)
    {
        $driverCode = isset($exception->errorInfo[1])
            ? (int) $exception->errorInfo[1]
            : 0;

        error_log('[Panther][clients] ' . $exception->getMessage());

        if ($driverCode === 1062) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'Ya existe un cliente con la cedula indicada.');
        }

        if ($driverCode === 3819 || $driverCode === 4025) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'Los datos no cumplen las restricciones de la tabla clientes.');
        }

        if ($driverCode === 1644) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'No hay identificadores de cliente disponibles entre 0001 y 9999.');
        }

        throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, $message);
    }
}
