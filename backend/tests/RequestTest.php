<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../rest/ctrl/business/Persons.php';
require_once __DIR__ . '/../rest/util/ExcepcionAPI.php';
require_once __DIR__ . '/../rest/util/Status.php';

final class RequestTest extends TestCase
{
    public function testInsertParameterBinding(): void
    {
        $person = new stdClass();
        $person->name = 'John';
        $person->lastName = 'Doe';
        $person->phone = '555-123';

        $stmt = $this->createMock(PDOStatement::class);
        $stmt->expects($this->exactly(3))->method('bindParam');

        $persons = new Persons();
        $persons->insertParameter($person, $stmt);

        $this->assertTrue(true); // Si no falla, la prueba pasa
    }
}
