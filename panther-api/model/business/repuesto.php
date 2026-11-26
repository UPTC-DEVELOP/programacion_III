<?php
class Repuesto
{
    public $id;
    public $referencia;
    public $descripcion;
    public $marca;
    public $precio_unitario;
    public $stock_actual;
    public $stock_minimo;
    public $stock_maximo;
    public $fecha_registro;
    public $dateDelete;

    public function __construct(
        $id = null,
        $referencia = '',
        $descripcion = '',
        $marca = '',
        $precio_unitario = 0.0,
        $stock_actual = 0,
        $stock_minimo = 0,
        $stock_maximo = 100,
        $fecha_registro = null,
        $dateDelete = null
    ) {
        $this->id = $id;
        $this->referencia = $referencia;
        $this->descripcion = $descripcion;
        $this->marca = $marca;
        $this->precio_unitario = $precio_unitario;
        $this->stock_actual = $stock_actual;
        $this->stock_minimo = $stock_minimo;
        $this->stock_maximo = $stock_maximo;
        $this->fecha_registro = $fecha_registro;
        $this->dateDelete = $dateDelete;
    }
    // --- Métodos de cálculo y validación de negocio ---

    public static function calcularNuevoStock(int $stockActual, int $cantidad, string $operacion = 'sumar'): int
    {
        $cantidadAbs = abs($cantidad);
        if ($operacion === 'restar') {
            return $stockActual - $cantidadAbs;
        }
        return $stockActual + $cantidadAbs;
    }

    public static function validarRangoStock(int $nuevoStock, int $stockMinimo, int $stockMaximo): bool
    {
        return $nuevoStock >= 0
            && $stockMinimo >= 0
            && $stockMaximo >= $stockMinimo
            && $nuevoStock <= $stockMaximo;
    }

    public static function calcularPrecioUnitario(float $precioBase, float $porcentajeMargen = 0.0): float
    {
        $precioCalculado = $precioBase * (1 + ($porcentajeMargen / 100));
        return round(max(0.0, $precioCalculado), 2);
    }

    public static function calcularSubtotal(int $cantidad, float $precioUnitario): float
    {
        return round(max(0, $cantidad) * max(0.0, $precioUnitario), 2);
    }
}