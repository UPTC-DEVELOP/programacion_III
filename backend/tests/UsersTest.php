<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../rest/ctrl/security/Users.php';
require_once __DIR__ . '/../rest/querys/security/UserQueries.php';
require_once __DIR__ . '/../rest/cxn/Connection.php';
require_once __DIR__ . '/../rest/util/ExcepcionAPI.php';
require_once __DIR__ . '/../rest/util/ContentBody.php';
require_once __DIR__ . '/../rest/util/Status.php';

/**
 * @covers Users
 * @group security
 */
final class UsersTest extends TestCase
{
    private Users $users;

    protected function setUp(): void
    {
        $this->users = new Users();
        $this->users->init(); // Carga las queries desde UserQueries
    }

    /**
     * ✅ Test: Crear usuario
     */
    public function testCreateUser(): void
    {
        $data = (object)[
            'user' => 'admin_test',
            'password' => '12345',
            'roles' => 1
        ];

        $result = $this->users->post($data);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
        $this->assertNotEmpty($result->getData(), 'Debe retornar los datos del usuario creado.');
    }

    /**
     * ✅ Test: Leer usuario
     */
    public function testReadUser(): void
    {
        $params = ['user' => 'admin_test'];
        $result = $this->users->get($params);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
        $this->assertNotEmpty($result->getData());
    }

    /**
     * ✅ Test: Actualizar usuario
     */
    public function testUpdateUser(): void
    {
        $data = (object)[
            'id' => 1,
            'password' => '54321'
        ];

        $result = $this->users->put($data);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
    }

    /**
     * ✅ Test: Eliminar usuario
     */
    public function testDeleteUser(): void
    {
        $params = ['user' => 'admin_test'];
        $result = $this->users->delete($params);

        $this->assertEquals(Status::NO_CONTENT, $result->getState());
        $this->assertEquals(Status::ST204, $result->getCode());
    }

    /**
     * ⚠️ Test: Crear usuario sin parámetros
     */
    public function testCreateUserWithoutData(): void
    {
        $this->expectException(ExcepcionAPI::class);
        $this->expectExceptionMessage('La solicitud no contiene parametros suficientes');

        $this->users->post((object)[]);
    }
}
