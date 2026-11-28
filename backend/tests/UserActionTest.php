<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../rest/ctrl/core/segurity/UserAction.php';
require_once __DIR__ . '/../rest/util/ExcepcionAPI.php';
require_once __DIR__ . '/../rest/util/Status.php';

final class UserActionTest extends TestCase
{
    public function testEncryptPassword(): void
    {
        $password = '1234';
        $encrypted = (new UserAction())->encryptPassword($password);

        $this->assertNotEquals($password, $encrypted);
        $this->assertTrue(password_verify($password, $encrypted));
    }

    public function testGenerateApiKey(): void
    {
        $key1 = (new UserAction())->getKeyAPI();
        $key2 = (new UserAction())->getKeyAPI();

        $this->assertNotEquals($key1, $key2);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $key1);
    }
}
