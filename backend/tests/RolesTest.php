<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../rest/ctrl/security/Roles.php';
require_once __DIR__ . '/../rest/querys/security/RolesQueries.php';
require_once __DIR__ . '/../rest/cxn/Connection.php';
require_once __DIR__ . '/../rest/util/ExcepcionAPI.php';
require_once __DIR__ . '/../rest/util/ContentBody.php';
require_once __DIR__ . '/../rest/util/Status.php';

/**
 * @covers Roles
 * @group security
 */
final class RolesTest extends TestCase
{
    private Roles $roles;

    protected function setUp(): void
    {
        $this->roles = new Roles();
        $this->roles->init(); // Carga las queries desde RolesQueries
    }

    /**
     * ✅ Test: Crear rol
     */
    public function testCreateRole(): void
    {
        $data = (object)[
            'name' => 'Tester',
            'description' => 'Rol de pruebas automatizadas'
        ];

        $result = $this->roles->post($data);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
        $this->assertNotEmpty($result->getData());
    }

    /**
     * ✅ Test: Leer roles
     */
    public function testReadRoles(): void
    {
        $params = [];
        $result = $this->roles->get($params);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
        $this->assertIsArray($result->getData());
    }

    /**
     * ✅ Test: Actualizar rol
     */
    public function testUpdateRole(): void
    {
        $data = (object)[
            'id' => 1,
            'description' => 'Rol de test actualizado'
        ];

        $result = $this->roles->put($data);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
    }

    /**
     * ✅ Test: Eliminar rol
     */
    public function testDeleteRole(): void
    {
        $params = ['id' => 1];
        $result = $this->roles->delete($params);

        $this->assertEquals(Status::NO_CONTENT, $result->getState());
        $this->assertEquals(Status::ST204, $result->getCode());
    }

    /**
     * ⚠️ Test: Crear rol sin parámetros
     */
    public function testCreateRoleWithoutData(): void
    {
        $this->expectException(ExcepcionAPI::class);
        $this->expectExceptionMessage('La solicitud no contiene parametros suficientes');

        $this->roles->post((object)[]);
    }
}
