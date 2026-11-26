<?php

/**
 * Consultas SQL del módulo de empleados.
 * Caso de uso: Services Mechanic.
 */

// Campos principales de empleados.

define(
    "EMPLOYEE_SELECT_FIELDS",
    "LPAD(CAST(id_empleado AS CHAR), 4, '0') AS idEmpleado,
     cedula, nombres, apellidos, telefono, cargo"
);

// READ - Consultar todos los empleados.

define(
    "SELECT_EMPLOYEES",
    "SELECT " . EMPLOYEE_SELECT_FIELDS . "
     FROM empleados
     ORDER BY id_empleado ASC"
);

// READ - Buscar empleados.

define(
    "SEARCH_EMPLOYEES",
    "SELECT " . EMPLOYEE_SELECT_FIELDS . "
     FROM empleados
     WHERE LOCATE(?, cedula) > 0
        OR LOCATE(?, nombres) > 0
        OR LOCATE(?, apellidos) > 0
        OR LOCATE(?, cargo) > 0
     ORDER BY id_empleado ASC"
);

// READ - Consultar un empleado por su ID.

define(
    "SELECT_EMPLOYEE_BY_ID",
    "SELECT " . EMPLOYEE_SELECT_FIELDS . "
     FROM empleados
     WHERE id_empleado = ?"
);

// Verificar si una cédula ya está registrada.

define(
    "COUNT_EMPLOYEE_BY_CEDULA",
    "SELECT COUNT(*)
     FROM empleados
     WHERE cedula = ?"
);

// Verificar cédulas duplicadas durante la actualización.

define(
    "COUNT_OTHER_EMPLOYEE_BY_CEDULA",
    "SELECT COUNT(*)
     FROM empleados
     WHERE cedula = ?
       AND id_empleado <> ?"
);


define(
    "INSERT_EMPLOYEE",
    "INSERT INTO empleados
     (cedula, nombres, apellidos, telefono, cargo)
     VALUES (?, ?, ?, ?, ?)"
);

define(
    "UPDATE_EMPLOYEE",
    "UPDATE empleados
     SET cedula = ?,
         nombres = ?,
         apellidos = ?,
         telefono = ?,
         cargo = ?
     WHERE id_empleado = ?"
);

define(
    "DELETE_EMPLOYEE",
    "DELETE FROM empleados
     WHERE id_empleado = ?"
);