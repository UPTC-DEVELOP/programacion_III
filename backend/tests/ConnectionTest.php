<?php
declare(strict_types=1);

use panther\cxn\Connection;
use PHPUnit\Framework\TestCase;

final class ConnectionTest extends TestCase
{
    public function testConnectionInstance(): void
    {
        $instance = Connection::getInstance();
        $this->assertInstanceOf(Connection::class, $instance);
    }

    public function testPDOConnection(): void
    {
        $pdo = Connection::getInstance()->getConnection();
        $this->assertInstanceOf(PDO::class, $pdo);

        $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
        $this->assertSame('taller_mecanico', $dbName);
    }
}
