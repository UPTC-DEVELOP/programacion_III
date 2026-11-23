<?php

/**
 * Representa los datos publicos de un cliente.
 */
class Client
{
    public $idCliente;
    public $cedula;
    public $nombres;
    public $apellidos;
    public $telefono;
    public $direccion;

    public function __construct($idCliente, $cedula, $nombres, $apellidos, $telefono, $direccion)
    {
        $this->idCliente = $idCliente;
        $this->cedula = $cedula;
        $this->nombres = $nombres;
        $this->apellidos = $apellidos;
        $this->telefono = $telefono;
        $this->direccion = $direccion;
    }

    /**
     * Construye el modelo desde una fila devuelta por PDO.
     *
     * @param array $row
     * @return Client
     */
    public static function fromRow($row)
    {
        return new self(
            $row['idCliente'],
            $row['cedula'],
            $row['nombres'],
            $row['apellidos'],
            $row['telefono'],
            $row['direccion']
        );
    }
}
