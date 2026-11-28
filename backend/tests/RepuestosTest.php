<?php
declare(strict_types=1);

use panther\ctrl\business\Repuestos;
use panther\model\business\Repuesto;
use panther\querys\business\RepuestosQueries;
use panther\util\ExcepcionAPI;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @group business
 */
#[CoversClass(Repuestos::class)]
final class RepuestosTest extends TestCase
{
    private Repuestos $repuestos;

    protected function setUp(): void
    {
        $this->repuestos = new Repuestos();
    }

    public function testValidarRepuestoAceptaDatosCompletos(): void
    {
        $data = (object) [
            'referencia' => 'bos-4821',
            'descripcion' => 'Pastillas de freno',
            'marca' => 'Bosch',
            'precio' => '145000'
        ];

        $this->repuestos->validarRepuesto($data);

        $this->assertSame('BOS-4821', $data->referencia);
        $this->assertSame('145000.00', $data->precio);
    }

    public function testValidarRepuestoRechazaReferencia(): void
    {
        $this->expectException(ExcepcionAPI::class);

        $this->repuestos->validarRepuesto((object) [
            'referencia' => 'B',
            'descripcion' => 'Filtro',
            'marca' => 'Mann',
            'precio' => 10
        ]);
    }

    public function testValidarRepuestoRechazaPrecio(): void
    {
        $this->expectException(ExcepcionAPI::class);
        $this->expectExceptionMessage('precio');

        $this->repuestos->validarRepuesto((object) [
            'referencia' => 'MAN-100',
            'descripcion' => 'Filtro de aceite',
            'marca' => 'Mann',
            'precio' => 0
        ]);
    }

    public function testInsertParameterEnlazaLosCampos(): void
    {
        $statement = $this->createMock(PDOStatement::class);
        $statement->expects($this->exactly(4))->method('bindParam');

        $this->repuestos->insertParameter((object) [
            'referencia' => 'BOS-4821',
            'descripcion' => 'Pastillas de freno',
            'marca' => 'Bosch',
            'precio' => '145000.00'
        ], $statement);
    }

    public function testUpdateParameterEnlazaLosCamposYElId(): void
    {
        $statement = $this->createMock(PDOStatement::class);
        $statement->expects($this->exactly(5))->method('bindParam');

        $this->repuestos->updateParameter((object) [
            'referencia' => 'BOS-4821',
            'descripcion' => 'Pastillas de freno',
            'marca' => 'Bosch',
            'precio' => '145000.00'
        ], $statement, 4);
    }

    public function testConsultasUsanParametrosPreparados(): void
    {
        $this->assertStringContainsString('INSERT INTO repuestos', RepuestosQueries::INSERT);
        $this->assertStringContainsString('?', RepuestosQueries::INSERT);
        $this->assertStringContainsString('UPDATE repuestos', RepuestosQueries::UPDATE);
        $this->assertStringContainsString('dateDelete IS NULL', RepuestosQueries::UPDATE);
        $this->assertStringContainsString('referencia = ?', RepuestosQueries::SELECT_BY_REFERENCIA);
        $this->assertStringContainsString('id = ?', RepuestosQueries::SELECT_BY_ID);
    }

    public function testModeloGuardaLosDatosDelRepuesto(): void
    {
        $repuesto = new Repuesto();
        $repuesto->setId(3);
        $repuesto->setReferencia('BOS-4821');
        $repuesto->setDescripcion('Pastillas de freno');
        $repuesto->setMarca('Bosch');
        $repuesto->setPrecio(145000.5);

        $this->assertSame(3, $repuesto->getId());
        $this->assertSame('BOS-4821', $repuesto->getReferencia());
        $this->assertSame('Pastillas de freno', $repuesto->getDescripcion());
        $this->assertSame('Bosch', $repuesto->getMarca());
        $this->assertSame(145000.5, $repuesto->getPrecio());
    }
}
