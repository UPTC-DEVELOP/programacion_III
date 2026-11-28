<?php
declare(strict_types=1);
namespace panther\util;
/**
 * Clase que contiene las constantes y recursos REST disponibles.
 *
 * <b>Descripción:</b> Define los recursos y parámetros utilizados
 * para el enrutamiento de servicios RESTful dentro del framework Panther.
 * <b>Caso de Uso:</b> PANTHER-Seguridad
 *
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 */
final class ResourcesURL
{
    /**
     * Lista de recursos REST disponibles.
     * Estos nombres deben coincidir con las clases controladoras.
     *
     * @var string[]
     */
    public const RESOURCES = [
        'users',
        'useraction',
        'roles',
        'persons',
        'prueba',
        'clientes',
        'vehiculos',
        'proveedores',
        'ordenes',
        'empleados',
        'repuestos',
        'inventario',
        'facturas'
    ];

    /**
     * Cabecera HTTP usada para autenticación por token.
     *
     * @var string
     */
    public const AUTHORIZATION = 'authorization';

    /**
     * Nombre del método usado para inicializar las clases Request.
     *
     * @var string
     */
    public const INIT_METHOD = 'init';
}

