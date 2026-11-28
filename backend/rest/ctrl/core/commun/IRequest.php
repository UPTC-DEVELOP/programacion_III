<?php
declare(strict_types=1);
namespace panther\ctrl\core\commun;
/**
 * ============================================================
 * Interfaz: IRequest
 * ------------------------------------------------------------
 * Descripción:
 *   Define la estructura base que deben implementar las clases
 *   encargadas de gestionar solicitudes tipo CRUD (Create, Read,
 *   Update, Delete) dentro del framework Panther.
 *
 * Propósito:
 *   - Establecer un contrato común para las clases que manejan
 *     peticiones RESTful.
 *   - Garantizar que todas las operaciones CRUD sigan una firma
 *     de métodos uniforme y segura.
 *
 * Caso de Uso:
 *   Módulo PANTHER - Seguridad
 * ------------------------------------------------------------
 * @author
 *     Josué Nicolás Pinzón Villamil
 * @updated
 *     Actualizado por Proyecto Actualización Panther 2025
 * ============================================================
 */
interface IRequest
{
    /**
     * ============================================================
     * Método: get()
     * ------------------------------------------------------------
     * Gestiona las solicitudes HTTP GET.
     * Debe retornar los recursos solicitados.
     *
     * @param array $request Parámetros de la URL o ruta
     * @return mixed Resultado o respuesta (ContentBody recomendado)
     * ============================================================
     */
    public function get(array $request): mixed;

    /**
     * ============================================================
     * Método: post()
     * ------------------------------------------------------------
     * Gestiona las solicitudes HTTP POST.
     * Debe crear un nuevo recurso basado en los datos enviados.
     *
     * @param array $request Parámetros de la URL o cuerpo JSON
     * @return mixed Resultado o respuesta
     * ============================================================
     */
    public function post(array $request): mixed;

    /**
     * ============================================================
     * Método: put()
     * ------------------------------------------------------------
     * Gestiona las solicitudes HTTP PUT.
     * Debe actualizar un recurso existente.
     *
     * @param array $request Parámetros de la URL o cuerpo JSON
     * @return mixed Resultado o respuesta
     * ============================================================
     */
    public function put(array $request): mixed;

    /**
     * ============================================================
     * Método: delete()
     * ------------------------------------------------------------
     * Gestiona las solicitudes HTTP DELETE.
     * Debe eliminar o marcar un recurso como inactivo.
     *
     * @param array $request Parámetros de la URL
     * @return mixed Resultado o respuesta
     * ============================================================
     */
    public function delete(array $request): mixed;

}

