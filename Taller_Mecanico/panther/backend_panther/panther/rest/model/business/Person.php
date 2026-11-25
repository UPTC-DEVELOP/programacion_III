<?php

/**
 * <b>Descripcion:</b> Clase que <br/>contiene los usuarios de la aplicación
 * <b>Caso de Uso:</b> PANTHER-Seguridad <br/>
 *
 * @author Josué Nicolás Pinzón Villamil <a href = "mailto:jpinzon@j4sysol.com">jpinzon@j4sysol.com</a>
 */
class Person
{

    /**
     * Identificador de la clase
     *
     * @var float Id
     */
    public $id;

    /**
     * Nombre de usuario
     *
     * @var string user
     */
    public $name;

    /**
     * Contraseña de usuario
     *
     * @var string password
     */
    public $lastName;

    /**
     * Roles asociados
     *
     * @var Rol roles
     */
    public $phone;
    /**
     * @return the $id
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return the $name
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return the $lastName
     */
    public function getLastName()
    {
        return $this->lastName;
    }

    /**
     * @return the $phone
     */
    public function getPhone()
    {
        return $this->phone;
    }

    /**
     * @param number $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @param string $lastName
     */
    public function setLastName($lastName)
    {
        $this->lastName = $lastName;
    }

    /**
     * @param Rol $phone
     */
    public function setPhone($phone)
    {
        $this->phone = $phone;
    }
 

    
}
?>

