<?php

/**
 * Gestiona RF13, RF14, RF15 y la parte segura de RF16 para repuestos.
 *
 * DELETE permanece bloqueado mientras el esquema no permita comprobar la
 * relacion entre repuestos y servicios. No usa la eliminacion generica.
 */
class Repuestos extends Request
{
    const NAME_TABLE = 'repuestos';

    public function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_SPARE_PART;
        parent::$queryUpdate = UPDATE_SPARE_PART;
    }

    /**
     * Lista todos los repuestos o busca por referencia, descripcion y marca.
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

        if (mb_strlen($criterion, 'UTF-8') > 100) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El criterio de busqueda permite maximo 100 caracteres.');
        }

        try {
            $pdo = Connection::getInstance()->getConnection();

            if ($criterion === '') {
                $statement = $pdo->prepare(SELECT_SPARE_PARTS);
            } else {
                $statement = $pdo->prepare(SEARCH_SPARE_PARTS);
                $statement->bindValue(1, $criterion, PDO::PARAM_STR);
                $statement->bindValue(2, $criterion, PDO::PARAM_STR);
                $statement->bindValue(3, $criterion, PDO::PARAM_STR);
            }

            $statement->execute();
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
            $spareParts = array();

            foreach ($rows as $row) {
                $spareParts[] = Repuesto::fromRow($row);
            }

            if (count($spareParts) === 0) {
                $message = $criterion === ''
                    ? 'No hay repuestos registrados.'
                    : 'No se encontraron repuestos para el criterio indicado.';
            } else {
                $message = 'Consulta de repuestos realizada exitosamente.';
            }

            return new ContentBody(OK, ST200, array(
                'mensaje' => $message,
                'repuestos' => $spareParts
            ));
        } catch (PDOException $exception) {
            $this->throwDatabaseException($exception, 'No fue posible consultar los repuestos.');
        }
    }

    /**
     * Registra un repuesto y devuelve su identificador de cuatro caracteres.
     */
    public function post($request)
    {
        UserAction::authenticator();
        $this->assertNoPathSegments($request);
        $payload = $this->decodePayload();

        if (property_exists($payload, 'idRepuesto')) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'idRepuesto es automatico y no debe enviarse.');
        }

        $sparePart = $this->validateSparePart($payload);
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            if ($this->referenceExists($pdo, $sparePart->referencia)) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'Ya existe un repuesto con la referencia indicada.');
            }

            $statement = $pdo->prepare(INSERT_SPARE_PART);
            $this->insertParameter($sparePart, $statement);
            $statement->execute();
            $id = (int) $pdo->lastInsertId();

            if ($id < 1 || $id > 9999) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'No hay identificadores de repuesto disponibles.');
            }

            $pdo->commit();

            return new ContentBody(CREATE, ST201, array(
                'idRepuesto' => $this->publicIdentifier($id),
                'mensaje' => 'Repuesto registrado exitosamente.'
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

            $this->throwDatabaseException($exception, 'No fue posible registrar el repuesto.');
        }
    }

    /**
     * Actualiza los campos editables sin modificar el identificador.
     */
    public function put($request)
    {
        UserAction::authenticator();
        $id = $this->identifierFromRequest($request);
        $publicId = $this->publicIdentifier($id);
        $payload = $this->decodePayload();

        if (property_exists($payload, 'idRepuesto') && $payload->idRepuesto !== $publicId) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El identificador del repuesto no puede modificarse.');
        }

        $sparePart = $this->validateSparePart($payload);
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            if (! $this->sparePartExists($pdo, $id, true)) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, 'El repuesto indicado no existe.');
            }

            if ($this->referenceExists($pdo, $sparePart->referencia, $id)) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'La referencia pertenece a otro repuesto.');
            }

            $statement = $pdo->prepare(UPDATE_SPARE_PART);
            $this->updateParameter($sparePart, $statement, $id);
            $statement->execute();
            $pdo->commit();

            return new ContentBody(OK, ST200, array(
                'idRepuesto' => $publicId,
                'mensaje' => 'Repuesto actualizado exitosamente.'
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

            $this->throwDatabaseException($exception, 'No fue posible actualizar el repuesto.');
        }
    }

    /**
     * Cancela de forma explicita o bloquea el borrado hasta conocer la relacion
     * real con servicios. Siempre devuelve el contrato de RF16.
     */
    public function delete($request)
    {
        UserAction::authenticator();
        $id = $this->identifierFromRequest($request);
        $publicId = $this->publicIdentifier($id);
        $payload = $this->decodePayload();

        if (! property_exists($payload, 'confirmacion') || ! is_bool($payload->confirmacion)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'confirmacion es obligatoria y debe ser true o false.');
        }

        try {
            $pdo = Connection::getInstance()->getConnection();

            if (! $this->sparePartExists($pdo, $id)) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, 'El repuesto indicado no existe.');
            }
        } catch (PDOException $exception) {
            $this->throwDatabaseException($exception, 'No fue posible verificar el repuesto.');
        }

        if ($payload->confirmacion === false) {
            return new ContentBody(OK, ST200, array(
                'idRepuesto' => $publicId,
                'eliminado' => false,
                'mensaje' => 'Eliminacion cancelada. El repuesto se conserva.'
            ));
        }

        return new ContentBody(CONFLICT, ST409, array(
            'idRepuesto' => $publicId,
            'eliminado' => false,
            'mensaje' => 'Eliminacion bloqueada: falta definir la relacion con servicios.'
        ));
    }

    public function insertParameter($object, $statement)
    {
        $statement->bindValue(1, $object->referencia, PDO::PARAM_STR);
        $statement->bindValue(2, $object->descripcion, PDO::PARAM_STR);
        $statement->bindValue(3, $object->marca, PDO::PARAM_STR);
        $statement->bindValue(4, $object->precio, PDO::PARAM_STR);
    }

    public function updateParameter($object, $statement, $id)
    {
        $this->insertParameter($object, $statement);
        $statement->bindValue(5, $id, PDO::PARAM_INT);
    }

    private function decodePayload()
    {
        $payload = JSONUtil::decodeJSON();

        if (! is_object($payload)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere un cuerpo JSON valido.');
        }

        return $payload;
    }

    private function validateSparePart($payload)
    {
        $limits = array(
            'referencia' => 20,
            'descripcion' => 100,
            'marca' => 40
        );
        $values = array();

        foreach ($limits as $field => $limit) {
            if (! property_exists($payload, $field) || ! is_string($payload->$field)) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' es obligatorio y debe ser texto.');
            }

            $values[$field] = $this->trimUnicode($payload->$field);

            if ($values[$field] === '') {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' no puede estar vacio ni contener solo espacios.');
            }

            if (mb_strlen($values[$field], 'UTF-8') > $limit) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' permite maximo ' . $limit . ' caracteres.');
            }

            if (preg_match('/[\x00-\x1F\x7F]/u', $values[$field])) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' contiene caracteres de control.');
            }
        }

        if (! property_exists($payload, 'precio') || (! is_int($payload->precio) && ! is_float($payload->precio))) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'precio es obligatorio y debe ser numerico.');
        }

        $price = (float) $payload->precio;

        if (! is_finite($price) || $price <= 0 || $price > 99999999.99) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'precio debe ser mayor que cero y maximo 99999999.99.');
        }

        if (abs(($price * 100) - round($price * 100)) > 0.000001) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'precio permite maximo dos decimales.');
        }

        return new Repuesto(
            null,
            $values['referencia'],
            $values['descripcion'],
            $values['marca'],
            number_format($price, 2, '.', '')
        );
    }

    private function trimUnicode($value)
    {
        return preg_replace('/^\s+|\s+$/u', '', $value);
    }

    private function assertNoPathSegments($request)
    {
        foreach ($request as $segment) {
            if ($segment !== '') {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, 'La URL contiene segmentos no permitidos.');
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
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere un idRepuesto valido de cuatro digitos.');
        }

        return (int) $segments[0];
    }

    private function publicIdentifier($id)
    {
        return str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function sparePartExists($pdo, $id, $lock = false)
    {
        $query = $lock ? LOCK_SPARE_PART_BY_ID : SELECT_SPARE_PART_BY_ID;
        $statement = $pdo->prepare($query);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();

        return $statement->fetch(PDO::FETCH_ASSOC) !== false;
    }

    private function referenceExists($pdo, $reference, $excludedId = null)
    {
        if ($excludedId === null) {
            $statement = $pdo->prepare(COUNT_SPARE_PART_BY_REFERENCE);
            $statement->bindValue(1, $reference, PDO::PARAM_STR);
        } else {
            $statement = $pdo->prepare(COUNT_OTHER_SPARE_PART_BY_REFERENCE);
            $statement->bindValue(1, $reference, PDO::PARAM_STR);
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

        error_log('[Panther][spareparts] ' . $exception->getMessage());

        if ($driverCode === 1062) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'Ya existe un repuesto con la referencia indicada.');
        }

        if ($driverCode === 3819 || $driverCode === 4025) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'Los datos no cumplen las restricciones de repuestos.');
        }

        if ($driverCode === 1644) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'No hay identificadores de repuesto disponibles.');
        }

        throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, $message);
    }
}
