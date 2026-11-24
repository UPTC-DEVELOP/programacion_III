<?php

class Repuesto
{
    public $idRepuesto;
    public $referencia;
    public $descripcion;
    public $marca;
    public $precio;

    public function __construct($idRepuesto, $referencia, $descripcion, $marca, $precio)
    {
        $this->idRepuesto = $idRepuesto;
        $this->referencia = $referencia;
        $this->descripcion = $descripcion;
        $this->marca = $marca;
        $this->precio = $precio;
    }

    /**
     * Construye el modelo desde una fila devuelta por PDO.
     *
     * @param array $row
     * @return Repuesto
     */
    public static function fromRow($row)
    {
        return new self(
            $row['idRepuesto'],
            $row['referencia'],
            $row['descripcion'],
            $row['marca'],
            number_format((float) $row['precio'], 2, '.', '')
        );
    }
}
