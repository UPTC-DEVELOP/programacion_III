<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../rest/ctrl/business/Persons.php';
require_once __DIR__ . '/../rest/querys/business/PersonQueries.php';
require_once __DIR__ . '/../rest/cxn/Connection.php';
require_once __DIR__ . '/../rest/util/ExcepcionAPI.php';
require_once __DIR__ . '/../rest/util/ContentBody.php';
require_once __DIR__ . '/../rest/util/Status.php';

/**
 * @covers Persons
 * @group business
 */
final class PersonsTest extends TestCase
{
    private Persons $persons;

    protected function setUp(): void
    {
        $this->persons = new Persons();
        $this->persons->init(); // Carga las queries desde PersonQueries
    }

    /**
     * ✅ Test: Crear una persona nueva
     */
    public function testCreatePerson(): void
    {
        $data = (object)[
            'name' => 'Fabian',
            'lastName' => 'Gomez',
            'phone' => '3001234567'
        ];

        $result = $this->persons->post($data);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
        $this->assertNotEmpty($result->getData(), 'Debe retornar el ID de la persona creada o datos del registro.');
    }

    /**
     * ✅ Test: Consultar persona existente
     */
    public function testReadPerson(): void
    {
        $params = ['name' => 'Fabian'];
        $result = $this->persons->get($params);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
        $this->assertNotEmpty($result->getData(), 'Debe devolver los datos de la persona.');
    }

    /**
     * ✅ Test: Actualizar información de la persona
     */
    public function testUpdatePerson(): void
    {
        $data = (object)[
            'id' => 1,
            'phone' => '3109876543'
        ];

        $result = $this->persons->put($data);

        $this->assertEquals(Status::OK, $result->getState());
        $this->assertEquals(Status::ST200, $result->getCode());
        $this->assertStringContainsString('actualizada', strtolower($result->getData() ?? ''));
    }

    /**
     * ✅ Test: Eliminar una persona
     */
    public function testDeletePerson(): void
    {
        $params = ['id' => 1];
        $result = $this->persons->delete($params);

        $this->assertEquals(Status::NO_CONTENT, $result->getState());
        $this->assertEquals(Status::ST204, $result->getCode());
    }

    /**
     * ⚠️ Test: Manejo de error al crear persona sin parámetros
     */
    public function testCreatePersonWithoutData(): void
    {
        $this->expectException(ExcepcionAPI::class);
        $this->expectExceptionMessage('La solicitud no contiene parametros suficientes');

        $this->persons->post((object)[]);
    }
}
