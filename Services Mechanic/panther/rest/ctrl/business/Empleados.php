
<?php

class Empleados extends Request
{
    const NAME_TABLE = 'empleados';

    public function init()
    {
        parent::$nameTable = self::NAME_TABLE;
        parent::$queryInsert = INSERT_EMPLOYEE;
        parent::$queryUpdate = UPDATE_EMPLOYEE;
    }

    /**
     * Lista empleados o busca por cedula, nombres, apellidos y cargo.
     */
    public function get($request)
    {
        UserAction::authenticator();
        $this->assertNoPathSegments($request);

        $criterion = isset($_GET['q']) ? $_GET['q'] : '';

        if (!is_string($criterion)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El criterio de busqueda debe ser texto.');
        }

        $criterion = $this->trimUnicode($criterion);

        if (mb_strlen($criterion, 'UTF-8') > 40) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El criterio de busqueda permite maximo 40 caracteres.');
        }

        try {
            $pdo = Connection::getInstance()->getConnection();

            if ($criterion === '') {
                $statement = $pdo->prepare(SELECT_EMPLOYEES);
            } else {
                $statement = $pdo->prepare(SEARCH_EMPLOYEES);
                $statement->bindValue(1, $criterion, PDO::PARAM_STR);
                $statement->bindValue(2, $criterion, PDO::PARAM_STR);
                $statement->bindValue(3, $criterion, PDO::PARAM_STR);
                $statement->bindValue(4, $criterion, PDO::PARAM_STR);
            }

            $statement->execute();
            $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
            $employees = array();

            foreach ($rows as $row) {
                $employees[] = Empleado::fromRow($row);
            }

            if (count($employees) === 0) {
                $message = $criterion === ''
                    ? 'No hay empleados registrados.'
                    : 'No se encontraron empleados para el criterio indicado.';
            } else {
                $message = 'Consulta de empleados realizada exitosamente.';
            }

            return new ContentBody(OK, ST200, array(
                'message' => $message,
                'empleados' => $employees
            ));

        } catch (PDOException $exception) {
            $this->throwDatabaseException(
                $exception,
                'No fue posible consultar los empleados.'
            );
        }
    }

    /**
     * Registra un empleado.
     */
    public function post($request)
    {
        UserAction::authenticator();
        $this->assertNoPathSegments($request);

        $payload = $this->decodePayload();

        if (property_exists($payload, 'idEmpleado')) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'idEmpleado es generado automaticamente y no debe enviarse.');
        }

        $employee = $this->validateEmployee($payload);
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            if ($this->cedulaExists($pdo, $employee->cedula)) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'Ya existe un empleado con la cedula indicada.');
            }

            $statement = $pdo->prepare(INSERT_EMPLOYEE);
            $this->insertParameter($employee, $statement);
            $statement->execute();

            $id = (int) $pdo->lastInsertId();

            if ($id < 1 || $id > 9999) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'No hay identificadores de empleado disponibles entre 0001 y 9999.');
            }

            $pdo->commit();

            return new ContentBody(CREATE, ST201, array(
                'message' => 'Empleado registrado exitosamente.',
                'idEmpleado' => $this->publicIdentifier($id)
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

            $this->throwDatabaseException(
                $exception,
                'No fue posible registrar el empleado.'
            );
        }
    }

    /**
     * Actualiza los datos del empleado seleccionado.
     */
    public function put($request)
    {
        UserAction::authenticator();

        $id = $this->identifierFromRequest($request);
        $publicId = $this->publicIdentifier($id);
        $payload = $this->decodePayload();

        if (property_exists($payload, 'idEmpleado') && $payload->idEmpleado !== $publicId) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'El identificador del empleado no puede modificarse.');
        }

        $employee = $this->validateEmployee($payload);
        $pdo = Connection::getInstance()->getConnection();

        try {
            $pdo->beginTransaction();

            if (!$this->employeeExists($pdo, $id)) {
                throw new ExcepcionAPI(NOT_FOUND, ST404, 'El empleado indicado no existe.');
            }

            if ($this->cedulaExists($pdo, $employee->cedula, $id)) {
                throw new ExcepcionAPI(CONFLICT, ST409, 'La cedula pertenece a otro empleado.');
            }

            $statement = $pdo->prepare(UPDATE_EMPLOYEE);
            $this->updateParameter($employee, $statement, $id);
            $statement->execute();

            $pdo->commit();

            return new ContentBody(OK, ST200, array(
                'message' => 'Empleado actualizado exitosamente.',
                'idEmpleado' => $publicId
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

            $this->throwDatabaseException(
                $exception,
                'No fue posible actualizar el empleado.'
            );
        }
    }

    /**
     * Elimina un empleado por su identificador.
     */
    public function delete($request)
    {
        UserAction::authenticator();

        $id = $this->identifierFromRequest($request);
        $payload = $this->decodePayload();

        if (!property_exists($payload, 'confirmacion') || $payload->confirmacion !== true) {
            throw new ExcepcionAPI(
                BAD_REQUEST,
                ST400,
                'Se requiere confirmacion explicita para eliminar el empleado.'
            );
        }

        try {
            $pdo = Connection::getInstance()->getConnection();

            if (!$this->employeeExists($pdo, $id)) {
                throw new ExcepcionAPI(
                    NOT_FOUND,
                    ST404,
                    'El empleado indicado no existe.'
                );
            }

            $statement = $pdo->prepare(DELETE_EMPLOYEE);
            $statement->bindValue(1, $id, PDO::PARAM_INT);
            $statement->execute();

            return new ContentBody(OK, ST200, array(
                'message' => 'Empleado eliminado exitosamente.',
                'idEmpleado' => $this->publicIdentifier($id)
            ));

        } catch (ExcepcionAPI $exception) {
            throw $exception;

        } catch (PDOException $exception) {
            $this->throwDatabaseException(
                $exception,
                'No fue posible eliminar el empleado.'
            );
        }
    }

    /**
     * Enlaza los campos para insertar un empleado.
     */
    public function insertParameter($object, $statement)
    {
        $statement->bindValue(1, $object->cedula, PDO::PARAM_STR);
        $statement->bindValue(2, $object->nombres, PDO::PARAM_STR);
        $statement->bindValue(3, $object->apellidos, PDO::PARAM_STR);
        $statement->bindValue(4, $object->telefono, PDO::PARAM_STR);
        $statement->bindValue(5, $object->cargo, PDO::PARAM_STR);
    }

    /**
     * Enlaza los campos para actualizar un empleado.
     */
    public function updateParameter($object, $statement, $id)
    {
        $statement->bindValue(1, $object->cedula, PDO::PARAM_STR);
        $statement->bindValue(2, $object->nombres, PDO::PARAM_STR);
        $statement->bindValue(3, $object->apellidos, PDO::PARAM_STR);
        $statement->bindValue(4, $object->telefono, PDO::PARAM_STR);
        $statement->bindValue(5, $object->cargo, PDO::PARAM_STR);
        $statement->bindValue(6, $id, PDO::PARAM_INT);
    }

    private function decodePayload()
    {
        $payload = JSONUtil::decodeJSON();

        if (!is_object($payload)) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere un cuerpo JSON valido.');
        }

        return $payload;
    }

    /**
     * Valida los datos recibidos del empleado.
     */
    private function validateEmployee($payload)
    {
        $fields = array('cedula', 'nombres', 'apellidos', 'telefono', 'cargo');
        $values = array();

        foreach ($fields as $field) {
            if (!property_exists($payload, $field) || !is_string($payload->$field)) {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' es obligatorio y debe enviarse como texto.');
            }

            $values[$field] = $this->trimUnicode($payload->$field);

            if ($values[$field] === '') {
                throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' no puede estar vacio ni contener solo espacios.');
            }
        }

        if (!preg_match('/^[0-9]{1,10}$/D', $values['cedula'])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'cedula debe contener entre 1 y 10 digitos.');
        }

        $this->validateName('nombres', $values['nombres']);
        $this->validateName('apellidos', $values['apellidos']);

        if (!preg_match('/^[0-9]{10}$/D', $values['telefono'])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'telefono debe contener exactamente 10 digitos.');
        }

        if (mb_strlen($values['cargo'], 'UTF-8') > 40) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'cargo permite maximo 40 caracteres.');
        }

        if (preg_match('/[\x00-\x1F\x7F]/u', $values['cargo'])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'cargo contiene caracteres no permitidos.');
        }

        return new Empleado(
            null,
            $values['cedula'],
            $values['nombres'],
            $values['apellidos'],
            $values['telefono'],
            $values['cargo']
        );
    }

    private function validateName($field, $value)
    {
        if (mb_strlen($value, 'UTF-8') > 40) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, $field . ' permite maximo 40 caracteres.');
        }

        if (!preg_match('/^(?=.*\p{L})[\p{L} \'\x{2019}-]+\z/u', $value)) {
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

        if (count($segments) !== 1 || !preg_match('/^(?!0000)[0-9]{4}$/D', $segments[0])) {
            throw new ExcepcionAPI(BAD_REQUEST, ST400, 'Se requiere un idEmpleado valido de cuatro digitos en la URL.');
        }

        return (int) $segments[0];
    }

    private function publicIdentifier($id)
    {
        return str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function employeeExists($pdo, $id)
    {
        $statement = $pdo->prepare(SELECT_EMPLOYEE_BY_ID);
        $statement->bindValue(1, $id, PDO::PARAM_INT);
        $statement->execute();

        return $statement->fetch(PDO::FETCH_ASSOC) !== false;
    }

    private function cedulaExists($pdo, $cedula, $excludedId = null)
    {
        if ($excludedId === null) {
            $statement = $pdo->prepare(COUNT_EMPLOYEE_BY_CEDULA);
            $statement->bindValue(1, $cedula, PDO::PARAM_STR);
        } else {
            $statement = $pdo->prepare(COUNT_OTHER_EMPLOYEE_BY_CEDULA);
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

        error_log('[Panther][empleados] ' . $exception->getMessage());

        if ($driverCode === 1062) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'Ya existe un empleado con la cedula indicada.');
        }

        if ($driverCode === 3819 || $driverCode === 4025) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'Los datos no cumplen las restricciones de la tabla empleados.');
        }

        if ($driverCode === 1644) {
            throw new ExcepcionAPI(CONFLICT, ST409, 'No hay identificadores de empleado disponibles entre 0001 y 9999.');
        }

        throw new ExcepcionAPI(INTERNAL_SERVER_ERROR, ST500, $message);
    }
}

