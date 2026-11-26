
<?php

class Empleado {

    public $idEmpleado;
    public $cedula;
    public $nombres;
    public $apellidos;
    public $telefono;
    public $cargo;

    public function __construct(
        $idEmpleado,
        $cedula,
        $nombres,
        $apellidos,
        $telefono,
        $cargo
    ) {
        $this->idEmpleado = $idEmpleado;
        $this->cedula = $cedula;
        $this->nombres = $nombres;
        $this->apellidos = $apellidos;
        $this->telefono = $telefono;
        $this->cargo = $cargo;
    }

    /**
     * Construye un empleado a partir de un registro de la BD.
     */
    public static function fromRow($row) {
        return new self(
            $row['idEmpleado'],
            $row['cedula'],
            $row['nombres'],
            $row['apellidos'],
            $row['telefono'],
            $row['cargo']
        );
    }
}

?>
